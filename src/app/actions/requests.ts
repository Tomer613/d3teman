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

export interface EventNotificationInput {
    category: string;
    eventType: string;
    description: string;
    eventDate: string;
    notes?: string;
}

export async function submitEventNotification(data: EventNotificationInput) {
    try {
        const session = await requireSession();

        const category = data.category.trim();
        const eventType = data.eventType.trim();
        const description = data.description.trim();
        if (!category || !eventType) {
            return { success: false as const, error: "Category and event type are required" };
        }
        if (!description) {
            return { success: false as const, error: "Description is required" };
        }
        const eventDate = new Date(data.eventDate);
        if (isNaN(eventDate.getTime())) {
            return { success: false as const, error: "A valid event date is required" };
        }

        await prisma.eventNotification.create({
            data: {
                memberId: session.sub,
                category,
                eventType,
                description,
                eventDate,
                notes: data.notes?.trim() || null,
            },
        });

        revalidatePath("/profile");
        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Submit Event Notification Error]:", error);
        return { success: false as const, error: "Failed to submit request" };
    }
}

export interface GeneralInquiryInput {
    subject: string;
    message: string;
}

export async function submitGeneralInquiry(data: GeneralInquiryInput) {
    try {
        const session = await requireSession();

        const subject = data.subject.trim();
        const message = data.message.trim();
        if (!subject) {
            return { success: false as const, error: "Subject is required" };
        }
        if (!message) {
            return { success: false as const, error: "Message is required" };
        }

        await prisma.generalInquiry.create({
            data: {
                memberId: session.sub,
                subject,
                message,
            },
        });

        revalidatePath("/profile");
        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Submit General Inquiry Error]:", error);
        return { success: false as const, error: "Failed to submit request" };
    }
}

export interface AliyahRequestInput {
    parsha: string;
    aliyahType?: string;
    occasion?: string;
    notes?: string;
}

export async function submitAliyahRequest(data: AliyahRequestInput) {
    try {
        const session = await requireSession();

        const parsha = data.parsha.trim();
        if (!parsha) {
            return { success: false as const, error: "Parsha is required" };
        }

        await prisma.aliyahRequest.create({
            data: {
                memberId: session.sub,
                parsha,
                aliyahType: data.aliyahType?.trim() || "no_preference",
                occasion: data.occasion?.trim() || null,
                notes: data.notes?.trim() || null,
            },
        });

        revalidatePath("/profile");
        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Submit Aliyah Request Error]:", error);
        return { success: false as const, error: "Failed to submit request" };
    }
}
