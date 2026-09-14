"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { getResendClient, getFromAddress, isEmailConfigured } from "@/lib/resend";
import { getEmailLogoUrl } from "@/lib/email";
import { render } from "@react-email/render";
import JoinRequestReplyEmail from "@/emails/JoinRequestReplyEmail";
import { revalidatePath } from "next/cache";

// Fetch pending requests, active members, and recent transactions
export async function getAdminDashboardData() {
    try {
        await requireAdmin();

        const [
            pendingRequests,
            members,
            recentTransactions,
            fundBreakdownRaw,
            recurringCount,
            totalAllTime,
            pendingKiddushCount,
            pendingHaftarahCount,
            pendingEventCount,
            pendingInquiryCount,
            pendingAliyahCount,
        ] = await Promise.all([
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
                    take: 20,
                    orderBy: { createdAt: "desc" },
                }),
                prisma.transaction.groupBy({
                    by: ["targetFund"],
                    _sum: { amount: true },
                    orderBy: { _sum: { amount: "desc" } },
                }),
                prisma.transaction.count({ where: { isRecurring: true } }),
                prisma.transaction.aggregate({ _sum: { amount: true } }),
                prisma.kiddushDonationRequest.count({ where: { status: "pending" } }),
                prisma.haftarahRequest.count({ where: { status: "pending" } }),
                prisma.eventNotification.count({ where: { status: "pending" } }),
                prisma.generalInquiry.count({ where: { status: "pending" } }),
                prisma.aliyahRequest.count({ where: { status: "pending" } }),
            ]);

        const fundBreakdown = fundBreakdownRaw.map((f: (typeof fundBreakdownRaw)[number]) => ({
            targetFund: f.targetFund,
            total: f._sum.amount ?? 0,
        }));

        return {
            pendingRequests,
            members,
            recentTransactions,
            totalIncome: totalAllTime._sum.amount ?? 0,
            fundBreakdown,
            recurringCount,
            emailConfigured: isEmailConfigured(),
            pendingMemberRequestsCount:
                pendingKiddushCount + pendingHaftarahCount + pendingEventCount + pendingInquiryCount + pendingAliyahCount,
        };
    } catch (error) {
        console.error("[Get Admin Data Error]:", error);
        return {
            pendingRequests: [],
            members: [],
            recentTransactions: [],
            totalIncome: 0,
            fundBreakdown: [],
            recurringCount: 0,
            emailConfigured: false,
            pendingMemberRequestsCount: 0,
        };
    }
}

// Fetch pending Kiddush-donation, Haftarah, event-notification, general-inquiry,
// and Aliyah requests for the /admin/requests review page
export async function getRequestsDashboardData() {
    try {
        await requireAdmin();

        const memberSelect = { firstName: true, lastName: true, phone: true, email: true } as const;

        const [kiddushRequests, haftarahRequests, eventNotifications, generalInquiries, aliyahRequests] =
            await Promise.all([
                prisma.kiddushDonationRequest.findMany({
                    where: { status: "pending" },
                    orderBy: { createdAt: "desc" },
                    include: { member: { select: memberSelect } },
                }),
                prisma.haftarahRequest.findMany({
                    where: { status: "pending" },
                    orderBy: { createdAt: "desc" },
                    include: { member: { select: memberSelect } },
                }),
                prisma.eventNotification.findMany({
                    where: { status: "pending" },
                    orderBy: { createdAt: "desc" },
                    include: { member: { select: memberSelect } },
                }),
                prisma.generalInquiry.findMany({
                    where: { status: "pending" },
                    orderBy: { createdAt: "desc" },
                    include: { member: { select: memberSelect } },
                }),
                prisma.aliyahRequest.findMany({
                    where: { status: "pending" },
                    orderBy: { createdAt: "desc" },
                    include: { member: { select: memberSelect } },
                }),
            ]);

        return { kiddushRequests, haftarahRequests, eventNotifications, generalInquiries, aliyahRequests };
    } catch (error) {
        console.error("[Get Requests Dashboard Data Error]:", error);
        return { kiddushRequests: [], haftarahRequests: [], eventNotifications: [], generalInquiries: [], aliyahRequests: [] };
    }
}

// Approve or reject a Kiddush-donation request
export async function reviewKiddushDonationRequest(requestId: string, status: "approved" | "rejected") {
    try {
        await requireAdmin();

        await prisma.kiddushDonationRequest.update({
            where: { id: requestId },
            data: { status },
        });

        revalidatePath("/admin/requests");
        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Review Kiddush Donation Request Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}

// Gabay-only scratch notes on a pending Kiddush-donation request
export async function updateKiddushDonationRequestNotes(requestId: string, notes: string) {
    try {
        await requireAdmin();

        await prisma.kiddushDonationRequest.update({
            where: { id: requestId },
            data: { adminNotes: notes.trim() || null },
        });

        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Kiddush Donation Request Notes Error]:", error);
        return { success: false as const, error: "Failed to save note" };
    }
}

// Approve or reject a Haftarah-reservation request
export async function reviewHaftarahRequest(requestId: string, status: "approved" | "rejected") {
    try {
        await requireAdmin();

        await prisma.haftarahRequest.update({
            where: { id: requestId },
            data: { status },
        });

        revalidatePath("/admin/requests");
        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Review Haftarah Request Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}

// Gabay-only scratch notes on a pending Haftarah request
export async function updateHaftarahRequestNotes(requestId: string, notes: string) {
    try {
        await requireAdmin();

        await prisma.haftarahRequest.update({
            where: { id: requestId },
            data: { adminNotes: notes.trim() || null },
        });

        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Haftarah Request Notes Error]:", error);
        return { success: false as const, error: "Failed to save note" };
    }
}

// Approve or reject an event notification (simcha/mourning)
export async function reviewEventNotification(requestId: string, status: "approved" | "rejected") {
    try {
        await requireAdmin();

        await prisma.eventNotification.update({
            where: { id: requestId },
            data: { status },
        });

        revalidatePath("/admin/requests");
        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Review Event Notification Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}

// Gabay-only scratch notes on a pending event notification
export async function updateEventNotificationNotes(requestId: string, notes: string) {
    try {
        await requireAdmin();

        await prisma.eventNotification.update({
            where: { id: requestId },
            data: { adminNotes: notes.trim() || null },
        });

        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Event Notification Notes Error]:", error);
        return { success: false as const, error: "Failed to save note" };
    }
}

// Approve or reject a general inquiry
export async function reviewGeneralInquiry(requestId: string, status: "approved" | "rejected") {
    try {
        await requireAdmin();

        await prisma.generalInquiry.update({
            where: { id: requestId },
            data: { status },
        });

        revalidatePath("/admin/requests");
        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Review General Inquiry Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}

// Gabay-only scratch notes on a pending general inquiry
export async function updateGeneralInquiryNotes(requestId: string, notes: string) {
    try {
        await requireAdmin();

        await prisma.generalInquiry.update({
            where: { id: requestId },
            data: { adminNotes: notes.trim() || null },
        });

        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Update General Inquiry Notes Error]:", error);
        return { success: false as const, error: "Failed to save note" };
    }
}

// Approve or reject an Aliyah request
export async function reviewAliyahRequest(requestId: string, status: "approved" | "rejected") {
    try {
        await requireAdmin();

        await prisma.aliyahRequest.update({
            where: { id: requestId },
            data: { status },
        });

        revalidatePath("/admin/requests");
        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Review Aliyah Request Error]:", error);
        return { success: false as const, error: "Failed to update request" };
    }
}

// Gabay-only scratch notes on a pending Aliyah request
export async function updateAliyahRequestNotes(requestId: string, notes: string) {
    try {
        await requireAdmin();

        await prisma.aliyahRequest.update({
            where: { id: requestId },
            data: { adminNotes: notes.trim() || null },
        });

        revalidatePath("/admin/requests");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Aliyah Request Notes Error]:", error);
        return { success: false as const, error: "Failed to save note" };
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
                    mustChangePassword: true,
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

// Generates a new one-time password for an existing member (e.g. after a
// "can't log in" report) and forces them to set a real one at next login -
// same pattern as the initial password issued on join-request approval.
export async function resetMemberPassword(memberId: string) {
    try {
        await requireAdmin();

        const initialPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
        const passwordHash = await hashPassword(initialPassword);

        await prisma.member.update({
            where: { id: memberId },
            data: { passwordHash, mustChangePassword: true },
        });

        revalidatePath("/admin");
        return { success: true as const, password: initialPassword };
    } catch (error) {
        console.error("[Reset Member Password Error]:", error);
        return { success: false as const, error: "Failed to reset password" };
    }
}

const VALID_ROLES = new Set(["member", "gabay", "super_admin"]);

// Changing roles is restricted to super_admin (stricter than the general
// requireAdmin gabay-or-super_admin check) to prevent a gabay self-escalating.
export async function updateMemberRole(memberId: string, newRole: string) {
    try {
        const session = await requireAdmin();
        if (session.role !== "super_admin") {
            return { success: false as const, error: "Only a super admin can change roles" };
        }
        if (!VALID_ROLES.has(newRole)) {
            return { success: false as const, error: "Invalid role" };
        }
        if (memberId === session.sub && newRole !== "super_admin") {
            return { success: false as const, error: "You cannot remove your own super admin role" };
        }

        await prisma.member.update({
            where: { id: memberId },
            data: { role: newRole },
        });

        revalidatePath("/admin");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Member Role Error]:", error);
        return { success: false as const, error: "Failed to update role" };
    }
}

// Deactivate/reactivate a member - gabay-level, same permission as approving
// a join request in the first place. Deactivating a super_admin still
// requires super_admin, so a gabay can't lock out a super_admin this way.
export async function setMemberApproval(memberId: string, isApproved: boolean) {
    try {
        const session = await requireAdmin();
        if (memberId === session.sub && !isApproved) {
            return { success: false as const, error: "You cannot deactivate your own account" };
        }

        if (!isApproved) {
            const target = await prisma.member.findUnique({ where: { id: memberId }, select: { role: true } });
            if (target?.role === "super_admin" && session.role !== "super_admin") {
                return { success: false as const, error: "Only a super admin can deactivate a super admin" };
            }
        }

        await prisma.member.update({
            where: { id: memberId },
            data: { isApproved },
        });

        revalidatePath("/admin");
        revalidatePath("/directory");
        return { success: true as const };
    } catch (error) {
        console.error("[Set Member Approval Error]:", error);
        return { success: false as const, error: "Failed to update member status" };
    }
}

// Sends a one-off personal email to a join-request applicant (e.g. asking a
// follow-up question) before the gabay decides to approve or reject them.
// Does not mark the request as processed - this is correspondence, not a
// decision.
export async function sendJoinRequestEmail(requestId: string, subject: string, body: string) {
    try {
        await requireAdmin();

        if (!isEmailConfigured()) {
            return { success: false as const, error: "Email sending is not configured yet (RESEND_API_KEY)" };
        }
        if (!subject.trim() || !body.trim()) {
            return { success: false as const, error: "Subject and body are required" };
        }

        const request = await prisma.joinRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            return { success: false as const, error: "Request not found" };
        }

        const html = await render(
            JoinRequestReplyEmail({
                subject,
                recipientFirstName: request.firstName,
                body,
                logoUrl: getEmailLogoUrl(),
            })
        );

        const resend = getResendClient();
        const result = await resend.emails.send({
            from: getFromAddress(),
            to: request.email,
            subject,
            html,
        });

        if (result.error) {
            console.error("[Send Join Request Email Error]:", result.error);
            return { success: false as const, error: "Failed to send email" };
        }

        return { success: true as const };
    } catch (error) {
        console.error("[Send Join Request Email Error]:", error);
        return { success: false as const, error: "Failed to send email" };
    }
}

// Gabay-only scratch notes on a pending join request (e.g. "waiting to hear
// back about their address"). Purely internal - never shown to the applicant.
export async function updateJoinRequestNotes(requestId: string, notes: string) {
    try {
        await requireAdmin();

        await prisma.joinRequest.update({
            where: { id: requestId },
            data: { adminNotes: notes.trim() || null },
        });

        revalidatePath("/admin");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Join Request Notes Error]:", error);
        return { success: false as const, error: "Failed to save note" };
    }
}