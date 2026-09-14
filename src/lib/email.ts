import fs from "fs";
import path from "path";
import { LOGO_PATH } from "@/lib/branding";
import { getAppUrl } from "@/lib/unsubscribe";

// Resolves to an absolute logo URL only once a real file has been dropped at
// public/logo.png - email templates fall back to the letter badge otherwise
// (email clients can't do a client-side onError fallback the way
// <CommunityLogo> does).
export function getEmailLogoUrl(): string | undefined {
    const logoFilePath = path.join(process.cwd(), "public", LOGO_PATH.replace(/^\//, ""));
    if (!fs.existsSync(logoFilePath)) {
        return undefined;
    }
    return `${getAppUrl()}${LOGO_PATH}`;
}
