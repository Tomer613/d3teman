"use client";

import { useState, useTransition } from "react";
import {
    reviewKiddushDonationRequest,
    updateKiddushDonationRequestNotes,
    reviewHaftarahRequest,
    updateHaftarahRequestNotes,
    reviewEventNotification,
    updateEventNotificationNotes,
    reviewGeneralInquiry,
    updateGeneralInquiryNotes,
    reviewAliyahRequest,
    updateAliyahRequestNotes,
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

interface EventNotificationRecord {
    id: string;
    category: string;
    eventType: string;
    description: string;
    eventDate: Date;
    notes: string | null;
    adminNotes: string | null;
    member: RequestContact;
}

interface GeneralInquiryRecord {
    id: string;
    subject: string;
    message: string;
    adminNotes: string | null;
    member: RequestContact;
}

interface AliyahRequestRecord {
    id: string;
    parsha: string;
    aliyahType: string;
    occasion: string | null;
    notes: string | null;
    adminNotes: string | null;
    member: RequestContact;
}

interface RequestsClientProps {
    kiddushRequests: KiddushRequestRecord[];
    haftarahRequests: HaftarahRequestRecord[];
    eventNotifications: EventNotificationRecord[];
    generalInquiries: GeneralInquiryRecord[];
    aliyahRequests: AliyahRequestRecord[];
}

const CATEGORY_LABELS: Record<string, string> = {
    simcha: "שמחה",
    aveilut: "אבלות",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
    birth: "לידה",
    bar_bat_mitzvah: "בר/בת מצווה",
    wedding: "חתונה",
    loss: "פטירה",
    yahrzeit: "יארצייט",
    other: "אחר",
};

const ALIYAH_TYPE_LABELS: Record<string, string> = {
    no_preference: "ללא העדפה",
    shlishi: "שלישי",
    revii: "רביעי",
    chamishi: "חמישי",
    shishi: "שישי",
    shevii: "שביעי",
    maftir: "מפטיר",
};

export default function RequestsClient({
    kiddushRequests,
    haftarahRequests,
    eventNotifications,
    generalInquiries,
    aliyahRequests,
}: RequestsClientProps) {
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

    const handleReviewEvent = (id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        setError(null);
        startTransition(async () => {
            const result = await reviewEventNotification(id, status);
            if (!result.success) {
                setError(result.error);
                setProcessingId(null);
                return;
            }
            router.refresh();
            setProcessingId(null);
        });
    };

    const handleReviewInquiry = (id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        setError(null);
        startTransition(async () => {
            const result = await reviewGeneralInquiry(id, status);
            if (!result.success) {
                setError(result.error);
                setProcessingId(null);
                return;
            }
            router.refresh();
            setProcessingId(null);
        });
    };

    const handleReviewAliyah = (id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        setError(null);
        startTransition(async () => {
            const result = await reviewAliyahRequest(id, status);
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
                        תרומות קידוש, הפטרות, עדכוני אירועים, פניות ובקשות עלייה שהוגשו על ידי חברי הקהילה וממתינות
                        לאישור
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

                <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-sm font-bold text-text">
                            בקשות עלייה לתורה ({aliyahRequests.length})
                        </h2>
                    </div>
                    {aliyahRequests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">אין כרגע בקשות ממתינות</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {aliyahRequests.map((req) => (
                                <RequestCard
                                    key={req.id}
                                    id={req.id}
                                    contact={req.member}
                                    adminNotes={req.adminNotes}
                                    isProcessing={processingId === req.id}
                                    onApprove={(id) => handleReviewAliyah(id, "approved")}
                                    onReject={(id) => handleReviewAliyah(id, "rejected")}
                                    onSaveNotes={updateAliyahRequestNotes}
                                    details={[
                                        { label: "פרשה", value: req.parsha },
                                        { label: "עלייה מבוקשת", value: ALIYAH_TYPE_LABELS[req.aliyahType] ?? req.aliyahType },
                                        ...(req.occasion ? [{ label: "סיבה", value: req.occasion }] : []),
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
                            עדכוני אירועים ({eventNotifications.length})
                        </h2>
                    </div>
                    {eventNotifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">אין כרגע בקשות ממתינות</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {eventNotifications.map((req) => (
                                <RequestCard
                                    key={req.id}
                                    id={req.id}
                                    contact={req.member}
                                    adminNotes={req.adminNotes}
                                    isProcessing={processingId === req.id}
                                    onApprove={(id) => handleReviewEvent(id, "approved")}
                                    onReject={(id) => handleReviewEvent(id, "rejected")}
                                    onSaveNotes={updateEventNotificationNotes}
                                    details={[
                                        {
                                            label: "סוג",
                                            value: `${CATEGORY_LABELS[req.category] ?? req.category} · ${EVENT_TYPE_LABELS[req.eventType] ?? req.eventType}`,
                                        },
                                        { label: "תאריך", value: new Date(req.eventDate).toLocaleDateString("he-IL") },
                                        { label: "פרטים", value: req.description },
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
                            פניות כלליות ({generalInquiries.length})
                        </h2>
                    </div>
                    {generalInquiries.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">אין כרגע בקשות ממתינות</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {generalInquiries.map((req) => (
                                <RequestCard
                                    key={req.id}
                                    id={req.id}
                                    contact={req.member}
                                    adminNotes={req.adminNotes}
                                    isProcessing={processingId === req.id}
                                    onApprove={(id) => handleReviewInquiry(id, "approved")}
                                    onReject={(id) => handleReviewInquiry(id, "rejected")}
                                    onSaveNotes={updateGeneralInquiryNotes}
                                    details={[
                                        { label: "נושא", value: req.subject },
                                        { label: "הודעה", value: req.message },
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
