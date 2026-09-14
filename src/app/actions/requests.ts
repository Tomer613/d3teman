"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface KiddushDonationRequestInput {
    occasion: string;
    preferredDate: string;
    amount?: number;
    notes?: string;
}

export async function submitKiddushDonationRequest(data: KiddushDonationRequestInput) {
    try {
        const session = await requireSession();

        const occasion = data.occasion.trim();
        const preferredDate = data.preferredDate.trim();
        if (!occasion) {
            return { success: false as const, error: "Occasion is required" };
        }
        if (!preferredDate) {
            return { success: false as const, error: "Preferred date is required" };
        }

        await prisma.kiddushDonationRequest.create({
            data: {
                memberId: session.sub,
                occasion,
                preferredDate,
                amount: data.amount && data.amount > 0 ? data.amount : null,
                notes: data.notes?.trim() || null,
            },
        });

        revalidatePath("/profile");
        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Submit Kiddush Donation Request Error]:", error);
        return { success: false as const, error: "Failed to submit request" };
    }
}

export interface HaftarahRequestInput {
    parsha: string;
    occasion?: string;
    notes?: string;
}

export async function submitHaftarahRequest(data: HaftarahRequestInput) {
    try {
        const session = await requireSession();

        const parsha = data.parsha.trim();
        if (!parsha) {
            return { success: false as const, error: "Parsha is required" };
        }

        await prisma.haftarahRequest.create({
            data: {
                memberId: session.sub,
                parsha,
                occasion: data.occasion?.trim() || null,
                notes: data.notes?.trim() || null,
            },
        });

        revalidatePath("/profile");
        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Submit Haftarah Request Error]:", error);
        return { success: false as const, error: "Failed to submit request" };
    }
}
