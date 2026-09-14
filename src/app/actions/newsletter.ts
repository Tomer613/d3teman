"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getResendClient, getFromAddress, isEmailConfigured } from "@/lib/resend";
import { createUnsubscribeToken, getAppUrl } from "@/lib/unsubscribe";
import { getEmailLogoUrl } from "@/lib/email";
import { render } from "@react-email/render";
import NewsletterEmail from "@/emails/NewsletterEmail";
import { revalidatePath } from "next/cache";

export interface NewsletterItemInput {
    category: string;
    title: string;
    body: string;
    imageUrl?: string;
}

export interface NewsletterListItem {
    id: string;
    subject: string;
    targetGroup: string;
    status: string;
    sentCount: number | null;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    items: NewsletterItemInput[];
}

// Prisma's Json column is loosely typed - this narrows it back to the
// concrete shape the newsletter editor actually stores.
function parseItems(raw: unknown): NewsletterItemInput[] {
    if (!Array.isArray(raw)) return [];
    return raw as NewsletterItemInput[];
}

const RECIPIENT_BATCH_SIZE = 90; // stays under Resend's 100-per-call batch limit

export interface NewsletterDashboardData {
    recipientCount: number;
    newsletters: NewsletterListItem[];
    emailConfigured: boolean;
}

export async function getNewsletterDashboardData(): Promise<NewsletterDashboardData> {
    try {
        await requireAdmin();

        const [recipientCount, newsletters] = await Promise.all([
            prisma.member.count({ where: { isApproved: true, receiveNewsletter: true } }),
            prisma.newsletter.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
        ]);

        return {
            recipientCount,
            emailConfigured: isEmailConfigured(),
            newsletters: newsletters.map((n) => ({
                id: n.id,
                subject: n.subject,
                targetGroup: n.targetGroup,
                status: n.status,
                sentCount: n.sentCount,
                sentAt: n.sentAt,
                createdAt: n.createdAt,
                updatedAt: n.updatedAt,
                items: parseItems(n.items),
            })),
        };
    } catch (error) {
        console.error("[Get Newsletter Dashboard Data Error]:", error);
        return { recipientCount: 0, newsletters: [], emailConfigured: false };
    }
}

export interface SaveNewsletterInput {
    id?: string;
    subject: string;
    targetGroup: string;
    items: NewsletterItemInput[];
}

export async function saveNewsletterDraft(data: SaveNewsletterInput) {
    try {
        await requireAdmin();

        if (!data.subject.trim()) {
            return { success: false as const, error: "Subject is required" };
        }

        if (data.id) {
            const existing = await prisma.newsletter.findUnique({ where: { id: data.id } });
            if (existing && existing.status !== "draft" && existing.status !== "failed") {
                return { success: false as const, error: "Cannot edit a newsletter that was already sent or is sending" };
            }
        }

        const items = data.items as unknown as Prisma.InputJsonValue;
        const record = data.id
            ? await prisma.newsletter.update({
                where: { id: data.id },
                data: { subject: data.subject, targetGroup: data.targetGroup, items },
            })
            : await prisma.newsletter.create({
                data: { subject: data.subject, targetGroup: data.targetGroup, items },
            });

        revalidatePath("/admin/newsletter");
        return { success: true as const, id: record.id };
    } catch (error) {
        console.error("[Save Newsletter Draft Error]:", error);
        return { success: false as const, error: "Failed to save draft" };
    }
}

export async function deleteNewsletterDraft(id: string) {
    try {
        await requireAdmin();

        const existing = await prisma.newsletter.findUnique({ where: { id } });
        if (!existing || (existing.status !== "draft" && existing.status !== "failed")) {
            return { success: false as const, error: "Only drafts or failed sends can be deleted" };
        }

        await prisma.newsletter.delete({ where: { id } });
        revalidatePath("/admin/newsletter");
        return { success: true as const };
    } catch (error) {
        console.error("[Delete Newsletter Draft Error]:", error);
        return { success: false as const, error: "Failed to delete draft" };
    }
}

export interface SendTestEmailInput {
    subject: string;
    items: NewsletterItemInput[];
}

export async function sendTestEmail(data: SendTestEmailInput) {
    try {
        const session = await requireAdmin();

        if (!isEmailConfigured()) {
            return { success: false as const, error: "Email sending is not configured yet (RESEND_API_KEY)" };
        }

        const unsubscribeToken = await createUnsubscribeToken(session.sub);
        const html = await render(
            NewsletterEmail({
                subject: `[בדיקה] ${data.subject}`,
                items: data.items,
                unsubscribeUrl: `${getAppUrl()}/unsubscribe?token=${unsubscribeToken}`,
                logoUrl: getEmailLogoUrl(),
            })
        );

        const resend = getResendClient();
        const result = await resend.emails.send({
            from: getFromAddress(),
            to: session.email,
            subject: `[בדיקה] ${data.subject}`,
            html,
        });

        if (result.error) {
            console.error("[Send Test Email Error]:", result.error);
            return { success: false as const, error: "Failed to send test email" };
        }

        return { success: true as const };
    } catch (error) {
        console.error("[Send Test Email Error]:", error);
        return { success: false as const, error: "Failed to send test email" };
    }
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

export async function sendNewsletter(newsletterId: string) {
    // Declared here (not inside the try) so the outer catch can still record
    // partial progress if something throws mid-batch (e.g. render() failing
    // on a malformed item), not just when Resend returns a `{error}` result.
    let sentSoFar = 0;
    try {
        await requireAdmin();

        if (!isEmailConfigured()) {
            return { success: false as const, error: "Email sending is not configured yet (RESEND_API_KEY)" };
        }

        const newsletter = await prisma.newsletter.findUnique({ where: { id: newsletterId } });
        if (!newsletter) {
            return { success: false as const, error: "Newsletter not found" };
        }
        if (newsletter.status !== "draft" && newsletter.status !== "failed") {
            return { success: false as const, error: "This newsletter was already sent or is currently sending" };
        }

        // Fails safe rather than silently sending to everyone: targeted
        // sub-groups aren't implemented yet (no board/volunteers membership
        // exists), so a targetGroup other than "all" must not be treated as "all".
        if (newsletter.targetGroup !== "all") {
            return { success: false as const, error: `Sending to "${newsletter.targetGroup}" is not supported yet` };
        }

        // Atomically claims the newsletter so two overlapping calls (a double
        // click, a retried request) can't both pass the status check above and
        // both send the full recipient list. Only one caller's update matches.
        const claim = await prisma.newsletter.updateMany({
            where: { id: newsletterId, status: newsletter.status },
            data: { status: "sending" },
        });
        if (claim.count === 0) {
            return { success: false as const, error: "This newsletter is already sending" };
        }

        const items = parseItems(newsletter.items);
        const recipients = await prisma.member.findMany({
            where: { isApproved: true, receiveNewsletter: true },
            select: { id: true, email: true },
        });

        if (recipients.length === 0) {
            await prisma.newsletter.update({ where: { id: newsletterId }, data: { status: "failed" } });
            return { success: false as const, error: "No recipients to send to" };
        }

        const from = getFromAddress();
        const appUrl = getAppUrl();
        const logoUrl = getEmailLogoUrl();
        const resend = getResendClient();

        // Sent as one email per recipient (rather than one email with every
        // address in "to") so recipients never see each other's addresses,
        // and so each gets their own one-click unsubscribe link.
        const batches = chunk(recipients, RECIPIENT_BATCH_SIZE);
        for (const batch of batches) {
            const batchPayload = await Promise.all(
                batch.map(async (r) => {
                    const unsubscribeToken = await createUnsubscribeToken(r.id);
                    const html = await render(
                        NewsletterEmail({
                            subject: newsletter.subject,
                            items,
                            unsubscribeUrl: `${appUrl}/unsubscribe?token=${unsubscribeToken}`,
                            logoUrl,
                        })
                    );
                    return { from, to: r.email, subject: newsletter.subject, html };
                })
            );

            const result = await resend.batch.send(batchPayload);
            if (result.error) {
                console.error("[Send Newsletter Error]:", result.error);
                // Records how many actually went out before the failure, and
                // marks the newsletter "failed" rather than reverting to
                // "draft" - a straight resend would re-email these recipients.
                await prisma.newsletter.update({
                    where: { id: newsletterId },
                    data: { status: "failed", sentCount: sentSoFar },
                });
                return {
                    success: false as const,
                    error: `Failed partway through sending - ${sentSoFar} of ${recipients.length} were sent before the error. Resending will re-email them.`,
                };
            }
            sentSoFar += batch.length;
        }

        await prisma.newsletter.update({
            where: { id: newsletterId },
            data: { status: "sent", sentAt: new Date(), sentCount: recipients.length },
        });

        revalidatePath("/admin/newsletter");
        return { success: true as const, sentCount: recipients.length };
    } catch (error) {
        console.error("[Send Newsletter Error]:", error);
        // Best-effort: release the "sending" claim (recording whatever partial
        // progress was made) so the newsletter isn't stuck unsendable forever
        // if an unexpected error hit before the batch loop's own failure
        // handling could record a status.
        await prisma.newsletter
            .updateMany({
                where: { id: newsletterId, status: "sending" },
                data: { status: "failed", sentCount: sentSoFar },
            })
            .catch(() => { });
        return { success: false as const, error: "Failed to send newsletter" };
    }
}
