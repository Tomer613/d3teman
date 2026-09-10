import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
    ADMIN_ROLES,
    SESSION_COOKIE_NAME,
    SessionPayload,
    verifySessionToken,
} from "@/lib/session";

export { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSessionToken } from "@/lib/session";
export type { SessionPayload } from "@/lib/session";

export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
        return null;
    }
    return verifySessionToken(token);
}

// Throws unless the caller has any active session. Server actions must call
// this themselves rather than relying on the proxy (middleware) alone.
//
// Re-reads role/approval from the database rather than trusting the JWT's
// claims for its full lifetime - otherwise a demoted or de-approved member
// would keep their old access for up to 30 days, until the token expires.
export async function requireSession(): Promise<SessionPayload> {
    const session = await getSession();
    if (!session) {
        throw new Error("Not authorized");
    }

    const member = await prisma.member.findUnique({
        where: { id: session.sub },
        select: { role: true, isApproved: true },
    });

    if (!member || !member.isApproved) {
        throw new Error("Not authorized");
    }

    return { ...session, role: member.role };
}

// Throws unless the caller has an active admin-capable session.
export async function requireAdmin(): Promise<SessionPayload> {
    const session = await requireSession();
    if (!ADMIN_ROLES.has(session.role)) {
        throw new Error("Not authorized");
    }
    return session;
}

// For admin Server Component pages: redirects to /login instead of throwing,
// so every admin route gets the same behavior on an invalid/expired/
// no-longer-admin session without repeating the try/catch at each call site.
export async function requireAdminOrRedirect(): Promise<SessionPayload> {
    try {
        return await requireAdmin();
    } catch {
        redirect("/login");
    }
}
