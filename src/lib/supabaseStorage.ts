import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const NEWSLETTER_IMAGES_BUCKET = "newsletter-images";

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSION_BY_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

// Maintain a single client instance (and a one-time bucket-ensure flag) across
// Next.js dev reloads, mirroring the pattern in src/lib/resend.ts.
const globalForSupabase = globalThis as unknown as {
    supabaseAdmin: SupabaseClient | undefined;
    supabaseBucketEnsured: boolean | undefined;
};

function getSupabaseUrl(): string | undefined {
    const url = process.env.SUPABASE_URL;
    if (!url || url.includes("PLACEHOLDER")) return undefined;
    return url;
}

function getServiceRoleKey(): string | undefined {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key || key.includes("PLACEHOLDER")) return undefined;
    return key;
}

export function isStorageConfigured(): boolean {
    return !!getSupabaseUrl() && !!getServiceRoleKey();
}

function getSupabaseAdminClient(): SupabaseClient {
    const url = getSupabaseUrl();
    const key = getServiceRoleKey();
    if (!url || !key) {
        throw new Error("Supabase storage is not configured");
    }
    if (!globalForSupabase.supabaseAdmin) {
        globalForSupabase.supabaseAdmin = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return globalForSupabase.supabaseAdmin;
}

// Lazily creates the bucket as PUBLIC (not signed URLs) - recipients' email
// clients fetch the image URL unauthenticated on every open, so there is no
// way to attach a bearer token or signed-URL secret to that request.
async function ensureBucketExists(client: SupabaseClient): Promise<void> {
    if (globalForSupabase.supabaseBucketEnsured) return;

    const { data: existing } = await client.storage.getBucket(NEWSLETTER_IMAGES_BUCKET);
    if (existing) {
        globalForSupabase.supabaseBucketEnsured = true;
        return;
    }

    const { error: createError } = await client.storage.createBucket(NEWSLETTER_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: MAX_IMAGE_BYTES,
        allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    });
    // Tolerates a race between two concurrent cold-starts both trying to create it.
    if (createError && !/already exists/i.test(createError.message)) {
        throw new Error(`Failed to create storage bucket "${NEWSLETTER_IMAGES_BUCKET}": ${createError.message}`);
    }
    globalForSupabase.supabaseBucketEnsured = true;
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

// Shared by both the file-upload and URL-ingest server actions - the only
// place that actually talks to Supabase Storage.
export async function uploadImageBuffer(input: { buffer: Buffer; contentType: string }): Promise<UploadResult> {
    const contentType = input.contentType.toLowerCase();
    if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(contentType)) {
        return { ok: false, error: "סוג הקובץ אינו נתמך (יש להשתמש ב-JPEG, PNG, WEBP או GIF)" };
    }
    if (input.buffer.length === 0) {
        return { ok: false, error: "הקובץ ריק" };
    }
    if (input.buffer.length > MAX_IMAGE_BYTES) {
        return { ok: false, error: "התמונה גדולה מדי (מקסימום 5MB)" };
    }

    const client = getSupabaseAdminClient();
    await ensureBucketExists(client);

    const key = `${randomUUID()}.${EXTENSION_BY_MIME[contentType]}`;
    const { error: uploadError } = await client.storage
        .from(NEWSLETTER_IMAGES_BUCKET)
        .upload(key, input.buffer, { contentType, upsert: false, cacheControl: "31536000" });

    if (uploadError) {
        return { ok: false, error: "העלאת התמונה לאחסון נכשלה" };
    }

    const { data } = client.storage.from(NEWSLETTER_IMAGES_BUCKET).getPublicUrl(key);
    return { ok: true, url: data.publicUrl };
}
