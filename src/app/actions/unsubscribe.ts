"use server";

import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export async function unsubscribeFromNewsletter(token: string) {
    const memberId = await verifyUnsubscribeToken(token);
    if (!memberId) {
        return { success: false as const, error: "Invalid or expired unsubscribe link" };
    }

    try {
        await prisma.member.update({
            where: { id: memberId },
            data: { receiveNewsletter: false },
        });
        return { success: true as const };
    } catch (error) {
        console.error("[Unsubscribe Error]:", error);
        return { success: false as const, error: "Failed to unsubscribe" };
    }
}
