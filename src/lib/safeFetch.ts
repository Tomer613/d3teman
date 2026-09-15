import { lookup } from "node:dns/promises";
import net from "node:net";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/supabaseStorage";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function isPrivateIPv4(ip: string): boolean {
    const [a, b] = ip.split(".").map(Number);
    if (a === 127) return true; // loopback 127.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (incl. cloud metadata 169.254.169.254)
    if (a === 0) return true; // 0.0.0.0/8
    return false;
}

function isPrivateIPv6(ip: string): boolean {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:")) return true; // link-local fe80::/10
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
    if (lower.startsWith("::ffff:")) {
        // IPv4-mapped IPv6
        const mapped = lower.slice("::ffff:".length);
        if (net.isIP(mapped) === 4) return isPrivateIPv4(mapped);
    }
    return false;
}

function isDisallowedIp(ip: string): boolean {
    return net.isIP(ip) === 4 ? isPrivateIPv4(ip) : isPrivateIPv6(ip);
}

async function validateExternalUrl(raw: string): Promise<{ ok: true; url: URL } | { ok: false; error: string }> {
    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return { ok: false, error: "כתובת לא תקינה" };
    }

    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
        return { ok: false, error: "רק כתובות http/https נתמכות" };
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
        return { ok: false, error: "כתובת חסומה" };
    }

    if (net.isIP(hostname)) {
        if (isDisallowedIp(hostname)) return { ok: false, error: "כתובת חסומה" };
    } else {
        let addresses;
        try {
            addresses = await lookup(hostname, { all: true });
        } catch {
            return { ok: false, error: "לא ניתן לפענח את הכתובת" };
        }
        // Also rejects hostnames that resolve to a private/loopback IP
        // (DNS rebinding / "attacker domain -> 127.0.0.1"), not just IP literals.
        if (addresses.some((a) => isDisallowedIp(a.address))) {
            return { ok: false, error: "כתובת חסומה" };
        }
    }

    return { ok: true, url };
}

export type FetchImageResult =
    | { ok: true; buffer: Buffer; contentType: string }
    | { ok: false; error: string };

// Follows redirects manually (redirect: "manual") and re-validates every hop -
// letting `fetch` auto-follow would let an initially-safe URL 302 into a
// private address and bypass the checks above entirely.
export async function fetchImageFromUrl(raw: string): Promise<FetchImageResult> {
    let currentUrl = raw;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const validation = await validateExternalUrl(currentUrl);
        if (!validation.ok) return validation;

        let res: Response;
        try {
            res = await fetch(validation.url.toString(), {
                redirect: "manual",
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
                headers: { "User-Agent": "d3teman-newsletter-image-fetch/1.0" },
            });
        } catch {
            return { ok: false, error: "לא ניתן היה להוריד את התמונה מהכתובת שסופקה" };
        }

        if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
            if (hop === MAX_REDIRECTS) return { ok: false, error: "יותר מדי הפניות (redirects)" };
            currentUrl = new URL(res.headers.get("location")!, validation.url).toString();
            continue;
        }

        if (!res.ok) {
            return { ok: false, error: `הבקשה נכשלה (סטטוס ${res.status})` };
        }

        const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
        if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(contentType)) {
            return { ok: false, error: "סוג הקובץ שהתקבל אינו תמונה נתמכת" };
        }

        const contentLength = res.headers.get("content-length");
        if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
            return { ok: false, error: "התמונה גדולה מדי (מקסימום 5MB)" };
        }
        if (!res.body) {
            return { ok: false, error: "לא התקבל תוכן מהכתובת" };
        }

        // Enforce the cap on actual bytes too, in case Content-Length is absent or lies.
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > MAX_IMAGE_BYTES) {
                await reader.cancel().catch(() => {});
                return { ok: false, error: "התמונה גדולה מדי (מקסימום 5MB)" };
            }
            chunks.push(value);
        }
        return { ok: true, buffer: Buffer.concat(chunks), contentType };
    }

    return { ok: false, error: "יותר מדי הפניות (redirects)" };
}
