import { Resend } from "resend";

// Maintain a single client instance during Next.js live development reloads
const globalForResend = globalThis as unknown as {
    resend: Resend | undefined;
};

function getApiKey(): string | undefined {
    const key = process.env.RESEND_API_KEY;
    // Treat the placeholder value from .env.example/.env as "not configured"
    // rather than attempting a real API call that would just fail with it.
    if (!key || key.includes("PLACEHOLDER")) {
        return undefined;
    }
    return key;
}

function getRawFromAddress(): string | undefined {
    const from = process.env.RESEND_FROM_EMAIL;
    if (!from || from.includes("PLACEHOLDER")) {
        return undefined;
    }
    return from;
}

// Both the API key and a real sender address are required before sending
// can actually work - checking only one would show "configured" in the UI
// while the other missing value still makes every send attempt fail.
export function isEmailConfigured(): boolean {
    return !!getApiKey() && !!getRawFromAddress();
}

export function getResendClient(): Resend {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }
    if (!globalForResend.resend) {
        globalForResend.resend = new Resend(apiKey);
    }
    return globalForResend.resend;
}

export function getFromAddress(): string {
    const from = getRawFromAddress();
    if (!from) {
        throw new Error("RESEND_FROM_EMAIL is not configured");
    }
    return from;
}
