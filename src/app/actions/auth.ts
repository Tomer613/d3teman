"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, requireSession, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/session";

const GENERIC_LOGIN_ERROR = "פרטי ההתחברות שגויים";

export async function login(formData: FormData) {
    try {
        const email = String(formData.get("email") ?? "").trim().toLowerCase();
        const password = String(formData.get("password") ?? "");

        if (!email || !password) {
            return { success: false as const, error: GENERIC_LOGIN_ERROR };
        }

        const member = await prisma.member.findUnique({ where: { email } });

        // Never reveal which specific check failed (no such member, no
        // password set yet, not approved, wrong password) - avoids user
        // enumeration and avoids leaking pending-approval status.
        if (!member || !member.passwordHash || !member.isApproved) {
            return { success: false as const, error: GENERIC_LOGIN_ERROR };
        }

        const passwordMatches = await verifyPassword(password, member.passwordHash);
        if (!passwordMatches) {
            return { success: false as const, error: GENERIC_LOGIN_ERROR };
        }

        const token = await createSessionToken({
            sub: member.id,
            role: member.role,
            email: member.email,
            mustChangePassword: member.mustChangePassword,
        });

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

        return { success: true as const, role: member.role, mustChangePassword: member.mustChangePassword };
    } catch (error) {
        console.error("[Login Error]:", error);
        return { success: false as const, error: GENERIC_LOGIN_ERROR };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    redirect("/login");
}

// Lets a logged-in member set a new password - required after a temporary
// (join-request approval) or reset (gabay-issued) password, and available
// any time as a voluntary self-service change. Re-issues the session cookie
// so mustChangePassword flips to false immediately, without requiring a
// fresh login.
export async function changePassword(newPassword: string) {
    try {
        const session = await requireSession();

        if (newPassword.length < 8) {
            return { success: false as const, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
        }

        const passwordHash = await hashPassword(newPassword);
        await prisma.member.update({
            where: { id: session.sub },
            data: { passwordHash, mustChangePassword: false },
        });

        const token = await createSessionToken({
            sub: session.sub,
            role: session.role,
            email: session.email,
            mustChangePassword: false,
        });
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

        return { success: true as const, role: session.role };
    } catch (error) {
        console.error("[Change Password Error]:", error);
        return { success: false as const, error: "Failed to change password" };
    }
}
