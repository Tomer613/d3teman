"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Fetch pending requests, active members, and recent transactions
export async function getAdminDashboardData() {
    try {
        await requireAdmin();

        const [pendingRequests, members, recentTransactions] = await Promise.all([
            prisma.joinRequest.findMany({
                where: { isProcessed: false },
                orderBy: { createdAt: "desc" },
            }),
            prisma.member.findMany({
                orderBy: { createdAt: "desc" },
                include: { yahrzeits: true },
                omit: { passwordHash: true },
            }),
            prisma.transaction.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const totalIncome = recentTransactions.reduce(
            (sum, tx) => sum + tx.amount,
            0
        );

        return {
            pendingRequests,
            members,
            recentTransactions,
            totalIncome,
        };
    } catch (error) {
        console.error("[Get Admin Data Error]:", error);
        return {
            pendingRequests: [],
            members: [],
            recentTransactions: [],
            totalIncome: 0,
        };
    }
}

// Approve a join request and generate a new verified community member.
// initialPassword is the plaintext password the gabay generates and hands
// to the new member out-of-band (phone/WhatsApp) - only its hash is stored.
export async function approveJoinRequest(requestId: string, initialPassword: string) {
    try {
        await requireAdmin();

        if (initialPassword.length < 8) {
            return { success: false as const, error: "Password must be at least 8 characters" };
        }

        const request = await prisma.joinRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            return { success: false as const, error: "Request not found" };
        }

        const passwordHash = await hashPassword(initialPassword);

        // Atomic transaction: create member and mark join request as processed
        await prisma.$transaction([
            prisma.member.create({
                data: {
                    email: request.email,
                    passwordHash,
                    firstName: request.firstName,
                    lastName: request.lastName,
                    phone: request.phone,
                    street: request.address,
                    city: request.city || "לא צוין",
                    isApproved: true,
                    role: "member",
                },
            }),
            prisma.joinRequest.update({
                where: { id: requestId },
                data: { isProcessed: true },
            }),
        ]);

        revalidatePath("/admin");
        revalidatePath("/directory");
        return { success: true as const };
    } catch (error) {
        console.error("[Approve Join Request Error]:", error);
        return { success: false as const, error: "Failed to approve member" };
    }
}

// Dismiss / reject a join request
export async function rejectJoinRequest(requestId: string) {
    try {
        await requireAdmin();

        await prisma.joinRequest.update({
            where: { id: requestId },
            data: { isProcessed: true },
        });

        revalidatePath("/admin");
        return { success: true as const };
    } catch (error) {
        console.error("[Reject Join Request Error]:", error);
        return { success: false as const, error: "Failed to dismiss request" };
    }
}