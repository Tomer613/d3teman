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

        // Lowercased to match the normalization every other signup path uses
        // (login, join-request) - otherwise this member could get an email
        // that collides case-insensitively with an existing one, or can
        // never log in later under the casing they were given.
        const email = data.email?.trim().toLowerCase() || null;
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

        // A head with other members in their family can't leave it - that
        // would strand those dependents in a family whose head is no longer
        // a member of it, and nobody left who could manage them.
        if (me?.familyId) {
            const currentFamily = await prisma.family.findUnique({
                where: { id: me.familyId },
                select: { headMemberId: true, _count: { select: { members: true } } },
            });
            if (currentFamily && currentFamily.headMemberId === session.sub && currentFamily._count.members > 1) {
                return {
                    success: false as const,
                    error: "Cannot leave your family while it still has other members",
                };
            }
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
                // updateMany + count guard (rather than a plain update) makes
                // this atomic against a concurrent duplicate review of the
                // same request - only the first caller to still find it
                // "pending" proceeds to move the member and clean up.
                const claim = await tx.familyLinkRequest.updateMany({
                    where: { id: requestId, status: "pending" },
                    data: { status },
                });
                if (claim.count === 0) {
                    return;
                }

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
            await prisma.familyLinkRequest.updateMany({ where: { id: requestId, status: "pending" }, data: { status } });
        }

        revalidatePath("/profile");
        revalidatePath("/directory");
        return { success: true as const };
    } catch (error) {
        console.error("[Review Family Link Request Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}
