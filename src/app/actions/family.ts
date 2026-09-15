"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CreateFamilyMemberInput {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
}

// Adds a dependent directly under the caller's own family - e.g. a husband
// creating an account for his wife. Auto-approved immediately (the head is
// already vetted) and needs no login credentials: email is optional and no
// password is set, matching the "family member with no login" use case.
export async function createFamilyMember(data: CreateFamilyMemberInput) {
    try {
        const session = await requireSession();

        const firstName = data.firstName.trim();
        const lastName = data.lastName.trim();
        if (!firstName || !lastName) {
            return { success: false as const, error: "First and last name are required" };
        }

        const head = await prisma.member.findUnique({
            where: { id: session.sub },
            select: { familyId: true, street: true, city: true, halachicStatus: true },
        });
        if (!head?.familyId) {
            return { success: false as const, error: "No family found" };
        }
        const family = await prisma.family.findUnique({ where: { id: head.familyId } });
        if (!family || family.headMemberId !== session.sub) {
            return { success: false as const, error: "Only the family head can add family members" };
        }

        const email = data.email?.trim() || null;
        if (email) {
            const existing = await prisma.member.findUnique({ where: { email } });
            if (existing) {
                return { success: false as const, error: "Email already in use" };
            }
        }

        await prisma.member.create({
            data: {
                email,
                firstName,
                lastName,
                phone: data.phone?.trim() || "",
                street: head.street,
                city: head.city,
                halachicStatus: head.halachicStatus,
                isApproved: true,
                familyId: family.id,
            },
        });

        revalidatePath("/profile");
        revalidatePath("/directory");
        return { success: true as const };
    } catch (error) {
        console.error("[Create Family Member Error]:", error);
        return { success: false as const, error: "Failed to add family member" };
    }
}

// A member found via the directory requests to join another member's family.
// Reviewed by that family's head, not a gabay - only the family itself can
// verify the relationship.
export async function requestFamilyLink(targetFamilyId: string, message?: string) {
    try {
        const session = await requireSession();

        const me = await prisma.member.findUnique({
            where: { id: session.sub },
            select: { familyId: true },
        });
        if (me?.familyId === targetFamilyId) {
            return { success: false as const, error: "Already a member of this family" };
        }

        const targetFamily = await prisma.family.findUnique({ where: { id: targetFamilyId } });
        if (!targetFamily) {
            return { success: false as const, error: "Family not found" };
        }

        const existingRequest = await prisma.familyLinkRequest.findFirst({
            where: { requesterId: session.sub, targetFamilyId, status: "pending" },
        });
        if (existingRequest) {
            return { success: false as const, error: "A request is already pending" };
        }

        await prisma.familyLinkRequest.create({
            data: {
                requesterId: session.sub,
                targetFamilyId,
                message: message?.trim() || null,
            },
        });

        revalidatePath("/directory");
        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Request Family Link Error]:", error);
        return { success: false as const, error: "Failed to submit request" };
    }
}

// The target family's head approves or rejects a pending link request. On
// approval, the requester is moved into the target family, and if that
// leaves their previous family (the solo family created at their own
// registration) with zero remaining members, it's deleted.
export async function reviewFamilyLinkRequest(requestId: string, status: "approved" | "rejected") {
    try {
        const session = await requireSession();

        const request = await prisma.familyLinkRequest.findUnique({
            where: { id: requestId },
            include: { targetFamily: true, requester: { select: { familyId: true } } },
        });
        if (!request || request.status !== "pending") {
            return { success: false as const, error: "Request not found" };
        }
        if (request.targetFamily.headMemberId !== session.sub) {
            return { success: false as const, error: "Only the family head can review this request" };
        }

        if (status === "approved") {
            const previousFamilyId = request.requester.familyId;

            await prisma.$transaction(async (tx) => {
                await tx.familyLinkRequest.update({ where: { id: requestId }, data: { status } });
                await tx.member.update({
                    where: { id: request.requesterId },
                    data: { familyId: request.targetFamilyId },
                });

                if (previousFamilyId && previousFamilyId !== request.targetFamilyId) {
                    const remaining = await tx.member.count({ where: { familyId: previousFamilyId } });
                    if (remaining === 0) {
                        await tx.family.delete({ where: { id: previousFamilyId } });
                    }
                }
            });
        } else {
            await prisma.familyLinkRequest.update({ where: { id: requestId }, data: { status } });
        }

        revalidatePath("/profile");
        revalidatePath("/directory");
        return { success: true as const };
    } catch (error) {
        console.error("[Review Family Link Request Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}
