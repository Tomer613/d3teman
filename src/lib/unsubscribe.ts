import { SignJWT, jwtVerify } from "jose";

// Signed, non-expiring tokens for one-click newsletter unsubscribe links.
// Reuses SESSION_SECRET (fine for a small app) but the "purpose" claim keeps
// these tokens from being usable as session tokens or vice versa.

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET is not set");
    }
    return new TextEncoder().encode(secret);
}

export async function createUnsubscribeToken(memberId: string): Promise<string> {
    return new SignJWT({ sub: memberId, purpose: "unsubscribe" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .sign(getSecretKey());
}

export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        if (payload.purpose !== "unsubscribe" || typeof payload.sub !== "string") {
            return null;
        }
        return payload.sub;
    } catch {
        return null;
    }
}

export function getAppUrl(): string {
    return process.env.APP_URL || "http://localhost:3000";
}
