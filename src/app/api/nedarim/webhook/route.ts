import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface NedarimWebhookPayload {
    MosadId?: string;
    TransactionId?: string;
    Amount?: string | number;
    ClientName?: string;
    Phone?: string;
    Email?: string;
    Target?: string;
    Status?: string;
    [key: string]: unknown;
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let payload: NedarimWebhookPayload = {};

        if (contentType.includes("application/json")) {
            payload = await request.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            formData.forEach((value, key) => {
                payload[key] = value.toString();
            });
        } else {
            const rawText = await request.text();
            const params = new URLSearchParams(rawText);
            params.forEach((value, key) => {
                payload[key] = value;
            });
        }

        const expectedMosadId = process.env.NEDARIM_MOSAD_ID;
        if (!expectedMosadId) {
            // Fail closed rather than falling back to a hardcoded, source-visible
            // default - an unset secret must never behave like a valid one.
            console.error("[Nedarim Webhook] NEDARIM_MOSAD_ID is not configured");
            return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
        }
        if (!payload.MosadId || payload.MosadId !== expectedMosadId) {
            return NextResponse.json({ error: "Invalid Mosad ID" }, { status: 401 });
        }

        const txId = payload.TransactionId || `tx_${Date.now()}`;
        const clientPhone = payload.Phone?.trim();
        const clientEmail = payload.Email?.trim().toLowerCase();

        // Check if payer matches an existing community member
        let matchedMemberId: string | null = null;
        if (clientPhone || clientEmail) {
            const matchedMember = await prisma.member.findFirst({
                where: {
                    OR: [
                        ...(clientPhone ? [{ phone: clientPhone }] : []),
                        ...(clientEmail ? [{ email: clientEmail }] : []),
                    ],
                },
                select: { id: true },
            });
            if (matchedMember) {
                matchedMemberId = matchedMember.id;
            }
        }

        // Persist transaction record
        const transaction = await prisma.transaction.upsert({
            where: { transactionId: txId },
            update: {
                amount: Number(payload.Amount) || 0,
                targetFund: payload.Target || "כללי",
            },
            create: {
                transactionId: txId,
                clientName: payload.ClientName || "אנונימי",
                amount: Number(payload.Amount) || 0,
                targetFund: payload.Target || "כללי",
                phone: clientPhone || null,
                email: clientEmail || null,
                memberId: matchedMemberId,
            },
        });

        console.log("[Nedarim Webhook] Synced to Database:", transaction.id);

        return NextResponse.json({
            status: "OK",
            receivedId: transaction.transactionId,
        });
    } catch (error) {
        console.error("[Nedarim Webhook Error]:", error);
        return NextResponse.json(
            { error: "Failed to persist transaction" },
            { status: 500 }
        );
    }
}