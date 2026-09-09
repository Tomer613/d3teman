"use server";

import { prisma } from "@/lib/prisma";

export interface JoinRequestInput {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    about?: string;
}

export async function submitJoinRequest(data: JoinRequestInput) {
    try {
        const city = data.city.trim();
        if (!city) {
            return { success: false as const, error: "City is required" };
        }

        const record = await prisma.joinRequest.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim().toLowerCase(),
                phone: data.phone.trim(),
                address: data.address.trim(),
                city,
                about: data.about?.trim() || null,
            },
        });

        return { success: true as const, id: record.id };
    } catch (error) {
        console.error("[Join Request Error]:", error);
        return { success: false as const, error: "Failed to persist join request" };
    }
}