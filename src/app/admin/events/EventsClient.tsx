"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent, deleteEvent, updateEvent, CommunityEventRecord } from "@/app/actions/events";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { copyToClipboard } from "@/lib/clipboard";

interface EventsClientProps {
    events: CommunityEventRecord[];
}

const EVENT_TYPES: { value: string; label: string }[] = [
    { value: "brit_yitzchak", label: "ברית יצחק" },
    { value: "shabbat_chatan", label: "שבת חתן" },
    { value: "bar_mitzvah", label: "בר מצווה" },
    { value: "wedding", label: "חתונה" },
    { value: "general", label: "כללי" },
];

function typeLabel(type: string): string {
    return EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function toDateInputValue(date: Date): string {
    return new Date(date).toISOString().slice(0, 10);
}

const emptyForm = {
    id: undefined as string | undefined,
    title: "",
    type: "general",
    description: "",
    eventDate: "",
    eventDateLabel: "",
    location: "",
};

export default function EventsClient({ events }: EventsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const startCreate = () => {
        setForm(emptyForm);
        setIsEditing(true);
        setMessage(null);
    };

    const startEdit = (event: CommunityEventRecord) => {
        setForm({
            id: event.id,
            title: event.title,
            type: event.type,
            description: event.description,
            eventDate: toDateInputValue(event.eventDate),
            eventDateLabel: event.eventDateLabel,
            location: event.location ?? "",
        });
        setIsEditing(true);
        setMessage(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
            const action = form.id ? updateEvent : createEvent;
            const result = await action(form);
            if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
            }
            setIsEditing(false);
            setForm(emptyForm);
            router.refresh();
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteEvent(id);
            if (!result.success) {
                setMessage({ type: "error", text: result.error });
                return;
            }
            router.refresh();
        });
    };

    const handleCopyForWhatsApp = async (event: CommunityEventRecord) => {
        const body = [event.location, event.description].filter(Boolean).join("\n");
        const text = buildWhatsAppMessage(event.title, [
            { category: typeLabel(event.type), title: event.eventDateLabel, body },
        ]);
        if (await copyToClipboard(text)) {
            setCopiedId(event.id);
            setTimeout(() => setCopiedId(null), 2000);
        } else {
            setMessage({ type: "error", text: "ההעתקה נכשלה" });
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link href="/admin" className="text-xs font-semibold text-primary hover:text-primary-hover">
                            ← חזרה לפאנל ניהול
                        </Link>
                        <h1 className="text-2xl font-bold text-text mt-1">שמחות ואירועים קרובים</h1>
                        <p className="text-sm text-text-muted">ניהול האירועים המוצגים בדף הבית</p>
                    </div>
                    {!isEditing && (
                        <button
                            type="button"
                            onClick={startCreate}
                            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                        >
                            + הוספת אירוע
                        </button>
                    )}
                </div>

                {message && (
                    <div
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${message.type === "success"
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-danger-bg border-danger-border text-danger"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {isEditing && (
                    <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                        <h2 className="text-sm font-bold text-text">{form.id ? "עריכת אירוע" : "אירוע חדש"}</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text">כותרת</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text">סוג</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                                >
                                    {EVENT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text">תאריך (לועזי, למיון)</label>
                                <input
                                    type="date"
                                    required
                                    value={form.eventDate}
                                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text">תאריך עברי (טקסט חופשי לתצוגה)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder='לדוגמה: אור לכ"ג בשבט'
                                    value={form.eventDateLabel}
                                    onChange={(e) => setForm({ ...form, eventDateLabel: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text">מיקום (אופציונלי)</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text">תיאור</label>
                            <textarea
                                rows={3}
                                required
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:bg-border text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                {isPending ? "שומר..." : "שמירה"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setForm(emptyForm); }}
                                className="px-4 py-2 text-text-muted hover:bg-background text-sm font-medium rounded-xl transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </form>
                )}

                <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-sm font-bold text-text">כל האירועים ({events.length})</h2>
                    </div>
                    {events.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">אין עדיין אירועים. הוסיפו את הראשון למעלה!</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {events.map((event) => (
                                <div key={event.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-accent/10 text-accent-hover">
                                                {typeLabel(event.type)}
                                            </span>
                                            <span className="font-semibold text-text text-sm">{event.title}</span>
                                        </div>
                                        <p className="text-xs text-text-muted">
                                            {event.eventDateLabel}
                                            {event.location ? ` • ${event.location}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyForWhatsApp(event)}
                                            className="px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            {copiedId === event.id ? "הועתק!" : "העתקה לוואטסאפ"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(event)}
                                            className="px-3 py-1.5 bg-background hover:bg-border text-text text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            עריכה
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(event.id)}
                                            disabled={isPending}
                                            className="px-3 py-1.5 bg-danger-bg hover:opacity-80 text-danger text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            מחיקה
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
