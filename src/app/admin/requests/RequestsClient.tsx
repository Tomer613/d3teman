"use client";

import { useState, useTransition } from "react";
import {
    reviewKiddushDonationRequest,
    updateKiddushDonationRequestNotes,
    reviewHaftarahRequest,
    updateHaftarahRequestNotes,
} from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import RequestCard, { type RequestContact } from "./RequestCard";

interface KiddushRequestRecord {
    id: string;
    occasion: string;
    preferredDate: string;
    amount: number | null;
    notes: string | null;
    adminNotes: string | null;
    member: RequestContact;
}

interface HaftarahRequestRecord {
    id: string;
    parsha: string;
    occasion: string | null;
    notes: string | null;
    adminNotes: string | null;
    member: RequestContact;
}

interface RequestsClientProps {
    kiddushRequests: KiddushRequestRecord[];
    haftarahRequests: HaftarahRequestRecord[];
}

export default function RequestsClient({ kiddushRequests, haftarahRequests }: RequestsClientProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReviewKiddush = (id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        setError(null);
        startTransition(async () => {
            const result = await reviewKiddushDonationRequest(id, status);
            if (!result.success) {
                setError(result.error);
                setProcessingId(null);
                return;
            }
            router.refresh();
            setProcessingId(null);
        });
    };

    const handleReviewHaftarah = (id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        setError(null);
        startTransition(async () => {
            const result = await reviewHaftarahRequest(id, status);
            if (!result.success) {
                setError(result.error);
                setProcessingId(null);
                return;
            }
            router.refresh();
            setProcessingId(null);
        });
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs">
                    <h1 className="text-xl font-bold text-text">בקשות חברי קהילה</h1>
                    <p className="text-xs text-text-muted mt-1">
                        תרומות קידוש והפטרות שהוגשו על ידי חברי הקהילה וממתינות לאישור
                    </p>
                </div>

                {error && (
                    <div className="px-4 py-2.5 rounded-xl text-sm font-medium border bg-danger-bg border-danger-border text-danger">
                        {error}
                    </div>
                )}

                <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-sm font-bold text-text">
                            בקשות תרומת קידוש ({kiddushRequests.length})
                        </h2>
                    </div>
                    {kiddushRequests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">אין כרגע בקשות ממתינות</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {kiddushRequests.map((req) => (
                                <RequestCard
                                    key={req.id}
                                    id={req.id}
                                    contact={req.member}
                                    adminNotes={req.adminNotes}
                                    isProcessing={processingId === req.id}
                                    onApprove={(id) => handleReviewKiddush(id, "approved")}
                                    onReject={(id) => handleReviewKiddush(id, "rejected")}
                                    onSaveNotes={updateKiddushDonationRequestNotes}
                                    details={[
                                        { label: "סיבה", value: req.occasion },
                                        { label: "מועד מבוקש", value: req.preferredDate },
                                        ...(req.amount ? [{ label: "סכום", value: `₪${req.amount.toLocaleString()}` }] : []),
                                        ...(req.notes ? [{ label: "הערות", value: req.notes }] : []),
                                    ]}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-sm font-bold text-text">
                            בקשות שריון הפטרה ({haftarahRequests.length})
                        </h2>
                    </div>
                    {haftarahRequests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">אין כרגע בקשות ממתינות</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {haftarahRequests.map((req) => (
                                <RequestCard
                                    key={req.id}
                                    id={req.id}
                                    contact={req.member}
                                    adminNotes={req.adminNotes}
                                    isProcessing={processingId === req.id}
                                    onApprove={(id) => handleReviewHaftarah(id, "approved")}
                                    onReject={(id) => handleReviewHaftarah(id, "rejected")}
                                    onSaveNotes={updateHaftarahRequestNotes}
                                    details={[
                                        { label: "פרשה / מועד", value: req.parsha },
                                        ...(req.occasion ? [{ label: "סיבה", value: req.occasion }] : []),
                                        ...(req.notes ? [{ label: "הערות", value: req.notes }] : []),
                                    ]}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
