"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword } from "@/lib/auth";
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
        });

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

        return { success: true as const, role: member.role };
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
