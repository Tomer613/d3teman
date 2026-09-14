"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Phone, MessageCircle, Mail, StickyNote } from "lucide-react";
import { sendJoinRequestEmail, updateJoinRequestNotes } from "@/app/actions/admin";
import { toWhatsAppNumber } from "@/lib/phone";
import { COMMUNITY_NAME } from "@/lib/branding";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Alert from "@/components/ui/Alert";

export interface PendingRequest {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    about: string | null;
    adminNotes: string | null;
}

interface JoinRequestCardProps {
    request: PendingRequest;
    emailConfigured: boolean;
    // The approve/reject controls (or the password-confirm panel) - kept in
    // the parent since that flow shares state (a single active approval)
    // across every card, unlike the email/notes panels below which are
    // entirely local to each card.
    actions: ReactNode;
}

export default function JoinRequestCard({ request, emailConfigured, actions }: JoinRequestCardProps) {
    const [isSending, startSending] = useTransition();
    const [isSavingNotes, startSavingNotes] = useTransition();

    const [isComposingEmail, setIsComposingEmail] = useState(false);
    const [emailSubject, setEmailSubject] = useState(`בנוגע לבקשת ההצטרפות שלך ל${COMMUNITY_NAME}`);
    // No pre-filled greeting here - JoinRequestReplyEmail already renders its
    // own "שלום {firstName}," above the body, so pre-filling one here would
    // double it up for anyone who sends without editing the default text.
    const [emailBody, setEmailBody] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [notes, setNotes] = useState(request.adminNotes ?? "");
    const [notesSaved, setNotesSaved] = useState(true);
    const [notesError, setNotesError] = useState<string | null>(null);

    const handleSendEmail = () => {
        setEmailError(null);
        startSending(async () => {
            const result = await sendJoinRequestEmail(request.id, emailSubject, emailBody);
            if (!result.success) {
                setEmailError(result.error);
                return;
            }
            setEmailSent(true);
            setEmailBody("");
        });
    };

    const handleToggleEmailPanel = () => {
        // Also resets the "sent" success state, so reopening the panel after
        // a previous send shows a fresh compose form instead of the stale
        // success message from the last send.
        setEmailSent(false);
        setIsComposingEmail((open) => !open);
    };

    const handleSaveNotes = () => {
        setNotesError(null);
        startSavingNotes(async () => {
            const result = await updateJoinRequestNotes(request.id, notes);
            if (!result.success) {
                setNotesError(result.error);
                return;
            }
            setNotesSaved(true);
        });
    };

    const whatsappMessage = `שלום ${request.firstName}, פונים אליך מ${COMMUNITY_NAME} בנוגע לבקשת ההצטרפות שלך לקהילה.`;

    return (
        <div className="p-5 space-y-3 hover:bg-background/50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-text text-sm">
                            {request.firstName} {request.lastName}
                        </span>
                        <span className="text-xs text-text-muted">({request.address}, {request.city})</span>
                        {request.adminNotes && (
                            <span
                                title="יש הערה פנימית שמורה"
                                className="inline-flex size-1.5 rounded-full bg-accent"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                    <div className="text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1">
                        <span>טלפון: {request.phone}</span>
                        <span>מייל: {request.email}</span>
                    </div>
                    {request.about && (
                        <p className="text-xs text-text-muted bg-background p-2 rounded-lg mt-1 border border-border">
                            &quot;{request.about}&quot;
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                            href={`tel:${request.phone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors"
                        >
                            <Phone className="size-3.5" aria-hidden="true" />
                            <span>שיחה טלפונית</span>
                        </a>
                        <a
                            href={`https://wa.me/${toWhatsAppNumber(request.phone)}?text=${encodeURIComponent(whatsappMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-success/10 hover:bg-success/20 text-success text-xs font-semibold rounded-lg transition-colors"
                        >
                            <MessageCircle className="size-3.5" aria-hidden="true" />
                            <span>שליחת הודעה</span>
                        </a>
                        <button
                            type="button"
                            onClick={handleToggleEmailPanel}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent-hover text-xs font-semibold rounded-lg transition-colors"
                        >
                            <Mail className="size-3.5" aria-hidden="true" />
                            <span>שליחת מייל</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsNotesOpen((open) => !open)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-background hover:bg-border text-text-muted text-xs font-semibold rounded-lg transition-colors"
                        >
                            <StickyNote className="size-3.5" aria-hidden="true" />
                            <span>הערות</span>
                        </button>
                    </div>
                </div>

                {actions}
            </div>

            {isComposingEmail && (
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                    {!emailConfigured ? (
                        <Alert variant="error">
                            שליחת מיילים אינה מוגדרת עדיין (חסר RESEND_API_KEY) - ניתן להגדיר בהמשך.
                        </Alert>
                    ) : emailSent ? (
                        <>
                            <Alert variant="success">המייל נשלח ל-{request.email}</Alert>
                            <button
                                type="button"
                                onClick={() => setEmailSent(false)}
                                className="text-xs font-semibold text-accent-hover hover:opacity-80"
                            >
                                כתיבת מייל נוסף
                            </button>
                        </>
                    ) : (
                        <>
                            <Input
                                label="נושא"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                            />
                            <Textarea
                                label="תוכן ההודעה"
                                rows={5}
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                            />
                            {emailError && <Alert variant="error">{emailError}</Alert>}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="accent"
                                    size="sm"
                                    onClick={handleSendEmail}
                                    isLoading={isSending}
                                    loadingLabel="שולח..."
                                >
                                    שליחה
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setIsComposingEmail(false)}
                                    className="px-3 py-2 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {isNotesOpen && (
                <div className="p-4 bg-background rounded-xl border border-border space-y-2">
                    <Textarea
                        label="הערות פנימיות (לגבאים בלבד, לא נשלח למגיש הבקשה)"
                        rows={3}
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            setNotesSaved(false);
                        }}
                        placeholder="לדוגמה: לברר עם מי מהמשפחה תואמים, או מה עלה בשיחה הטלפונית..."
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
