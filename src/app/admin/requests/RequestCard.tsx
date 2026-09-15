"use client";

import { useState, useTransition } from "react";
import { Phone, MessageCircle, StickyNote } from "lucide-react";
import { toWhatsAppNumber } from "@/lib/phone";
import { COMMUNITY_NAME } from "@/lib/branding";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Alert from "@/components/ui/Alert";

export interface RequestContact {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
}

export interface RequestDetail {
    label: string;
    value: string;
}

interface RequestCardProps {
    id: string;
    contact: RequestContact;
    details: RequestDetail[];
    adminNotes: string | null;
    isProcessing: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    // Omitted for review flows that don't need gabay-style scratch notes
    // (e.g. a family-link approval reviewed by a peer, not a gabay) - the
    // notes button/panel is hidden entirely when this isn't provided.
    onSaveNotes?: (id: string, notes: string) => Promise<{ success: boolean; error?: string }>;
}

// Generalized review card shared by every member-submitted request type
// (Kiddush donation, Haftarah reservation, and future ones) - mirrors
// JoinRequestCard's contact chips (call/WhatsApp) and notes panel, but takes
// the type-specific fields as a generic {label, value} list instead of
// hardcoding one model's shape.
export default function RequestCard({
    id,
    contact,
    details,
    adminNotes,
    isProcessing,
    onApprove,
    onReject,
    onSaveNotes,
}: RequestCardProps) {
    const [isSavingNotes, startSavingNotes] = useTransition();
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notes, setNotes] = useState(adminNotes ?? "");
    const [notesSaved, setNotesSaved] = useState(true);
    const [notesError, setNotesError] = useState<string | null>(null);

    const handleSaveNotes = () => {
        if (!onSaveNotes) return;
        setNotesError(null);
        startSavingNotes(async () => {
            const result = await onSaveNotes(id, notes);
            if (!result.success) {
                setNotesError(result.error ?? "Failed to save note");
                return;
            }
            setNotesSaved(true);
        });
    };

    const whatsappMessage = `שלום ${contact.firstName}, פונים אליך מ${COMMUNITY_NAME} בנוגע לבקשה שהגשת.`;

    return (
        <div className="p-5 space-y-3 hover:bg-background/50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text text-sm">
                            {contact.firstName} {contact.lastName}
                        </span>
                        {adminNotes && (
                            <span
                                title="יש הערה פנימית שמורה"
                                className="inline-flex size-1.5 rounded-full bg-accent"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                    <div className="text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1">
                        <span>טלפון: {contact.phone}</span>
                        {contact.email && <span>מייל: {contact.email}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text bg-background p-2 rounded-lg mt-1 border border-border">
                        {details.map((d) => (
                            <span key={d.label}>
                                <span className="text-text-muted">{d.label}: </span>
                                <span className="font-medium">{d.value}</span>
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                            href={`tel:${contact.phone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors"
                        >
                            <Phone className="size-3.5" aria-hidden="true" />
                            <span>שיחה טלפונית</span>
                        </a>
                        <a
                            href={`https://wa.me/${toWhatsAppNumber(contact.phone)}?text=${encodeURIComponent(whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-success/10 hover:bg-success/20 text-success text-xs font-semibold rounded-lg transition-colors"
                        >
                            <MessageCircle className="size-3.5" aria-hidden="true" />
                            <span>שליחת הודעה</span>
                        </a>
                        {onSaveNotes && (
                            <button
                                type="button"
                                onClick={() => setIsNotesOpen((open) => !open)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-background hover:bg-border text-text-muted text-xs font-semibold rounded-lg transition-colors"
                            >
                                <StickyNote className="size-3.5" aria-hidden="true" />
                                <span>הערות</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => onApprove(id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-border text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                    >
                        {isProcessing ? "מעדכן..." : "אישור"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onReject(id)}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-danger-bg hover:opacity-80 disabled:opacity-50 text-danger text-xs font-semibold rounded-xl border border-danger-border transition-colors"
                    >
                        דחייה
                    </button>
                </div>
            </div>

            {onSaveNotes && isNotesOpen && (
                <div className="p-4 bg-background rounded-xl border border-border space-y-2">
                    <Textarea
                        label="הערות פנימיות (לגבאים בלבד, לא נשלח למגיש הבקשה)"
                        rows={3}
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            setNotesSaved(false);
                        }}
                        placeholder="לדוגמה: לתאם עם המשפחה, או לבדוק זמינות בלוח..."
                    />
                    {notesError && <Alert variant="error">{notesError}</Alert>}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={notesSaved}
                        isLoading={isSavingNotes}
                        loadingLabel="שומר..."
                    >
                        {notesSaved ? "נשמר" : "שמירת הערה"}
                    </Button>
                </div>
            )}
        </div>
    );
}
