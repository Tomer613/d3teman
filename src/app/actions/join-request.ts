"use server";

import { prisma } from "@/lib/prisma";

export interface JoinRequestInput {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    about?: string;
}

export async function submitJoinRequest(data: JoinRequestInput) {
    try {
        const record = await prisma.joinRequest.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim().toLowerCase(),
                phone: data.phone.trim(),
                address: data.address.trim(),
                about: data.about?.trim() || null,
            },
        });

        return { success: true, id: record.id };
    } catch (error) {
        console.error("[Join Request Error]:", error);
        return { success: false, error: "Failed to persist join request" };
    }
}