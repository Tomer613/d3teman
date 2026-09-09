"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fetch pending requests, active members, and recent transactions
export async function getAdminDashboardData() {
    try {
        const [pendingRequests, members, recentTransactions] = await Promise.all([
            prisma.joinRequest.findMany({
                where: { isProcessed: false },
                orderBy: { createdAt: "desc" },
            }),
            prisma.member.findMany({
                orderBy: { createdAt: "desc" },
                include: { yahrzeits: true },
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

// Approve a join request and generate a new verified community member
export async function approveJoinRequest(requestId: string) {
    try {
        const request = await prisma.joinRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            return { success: false, error: "Request not found" };
        }

        // Atomic transaction: create member and mark join request as processed
        await prisma.$transaction([
            prisma.member.create({
                data: {
                    email: request.email,
                    firstName: request.firstName,
                    lastName: request.lastName,
                    phone: request.phone,
                    street: request.address,
                    city: "ישראל",
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
        return { success: true };
    } catch (error) {
        console.error("[Approve Join Request Error]:", error);
        return { success: false, error: "Failed to approve member" };
    }
}

// Dismiss / reject a join request
export async function rejectJoinRequest(requestId: string) {
    try {
        await prisma.joinRequest.update({
            where: { id: requestId },
            data: { isProcessed: true },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("[Reject Join Request Error]:", error);
        return { success: false, error: "Failed to dismiss request" };
    }
}