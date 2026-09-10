"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    deleteNewsletterDraft,
    NewsletterItemInput,
    NewsletterListItem,
    saveNewsletterDraft,
    sendNewsletter,
    sendTestEmail,
} from "@/app/actions/newsletter";
import { COMMUNITY_NAME, COMMUNITY_ADDRESS_LINE, LOGO_INITIAL } from "@/lib/branding";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { copyToClipboard } from "@/lib/clipboard";

type NewsletterCategory = "שמחות" | "הודעת ועד" | "זמני תפילה" | "השכבות";

interface NewsletterClientProps {
    recipientCount: number;
    emailConfigured: boolean;
    newsletters: NewsletterListItem[];
}

const CATEGORIES: NewsletterCategory[] = ["שמחות", "הודעת ועד", "זמני תפילה", "השכבות"];

const emptyNewItem = { category: "הודעת ועד" as NewsletterCategory, title: "", body: "", imageUrl: "" };

export default function NewsletterClient({ recipientCount, emailConfigured, newsletters }: NewsletterClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [currentId, setCurrentId] = useState<string | null>(null);
    const [subject, setSubject] = useState("עלון שבת קהילתי");
    const [targetGroup, setTargetGroup] = useState<"all" | "board" | "volunteers">("all");
    const [items, setItems] = useState<NewsletterItemInput[]>([]);

    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItem, setNewItem] = useState(emptyNewItem);

    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [confirmingSend, setConfirmingSend] = useState(false);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title || !newItem.body) return;

        setItems([...items, { ...newItem, imageUrl: newItem.imageUrl || undefined }]);
        setNewItem(emptyNewItem);
        setIsAddingItem(false);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const resetEditor = () => {
        setCurrentId(null);
        setSubject("עלון שבת קהילתי");
        setTargetGroup("all");
        setItems([]);
        setStatusMessage(null);
    };

    const loadDraft = (newsletter: NewsletterListItem) => {
        setCurrentId(newsletter.id);
        setSubject(newsletter.subject);
        setTargetGroup(
            newsletter.targetGroup === "board" || newsletter.targetGroup === "volunteers"
                ? newsletter.targetGroup
                : "all"
        );
        setItems(newsletter.items);
        setStatusMessage(null);
    };

    const handleSaveDraft = () => {
        setStatusMessage(null);
        startTransition(async () => {
            const result = await saveNewsletterDraft({ id: currentId ?? undefined, subject, targetGroup, items });
            if (!result.success) {
                setStatusMessage({ type: "error", text: result.error });
                return;
            }
            setCurrentId(result.id);
            setStatusMessage({ type: "success", text: "הטיוטה נשמרה בהצלחה" });
            router.refresh();
        });
    };

    const handleCopyForWhatsApp = async () => {
        const text = buildWhatsAppMessage(subject, items);
        if (await copyToClipboard(text)) {
            setStatusMessage({ type: "success", text: "הטקסט הועתק - ניתן להדביק בקבוצת הוואטסאפ" });
        } else {
            setStatusMessage({ type: "error", text: "ההעתקה נכשלה" });
        }
    };

    const handleSendTest = () => {
        setStatusMessage(null);
        startTransition(async () => {
            const result = await sendTestEmail({ subject, items });
            setStatusMessage(
                result.success
                    ? { type: "success", text: "מייל בדיקה נשלח לכתובת שלך" }
                    : { type: "error", text: result.error }
            );
        });
    };

    const handleConfirmSend = () => {
        setStatusMessage(null);
        startTransition(async () => {
            // Ensure the current edits are persisted before sending.
            const saveResult = await saveNewsletterDraft({ id: currentId ?? undefined, subject, targetGroup, items });
            if (!saveResult.success) {
                setStatusMessage({ type: "error", text: saveResult.error });
                setConfirmingSend(false);
                return;
            }
            setCurrentId(saveResult.id);

            const sendResult = await sendNewsletter(saveResult.id);
            setConfirmingSend(false);
            if (!sendResult.success) {
                setStatusMessage({ type: "error", text: sendResult.error });
                return;
            }
            setStatusMessage({ type: "success", text: `הניוזלטר נשלח בהצלחה ל-${sendResult.sentCount} נמענים` });
            router.refresh();
        });
    };

    const handleDeleteDraft = (id: string) => {
        startTransition(async () => {
            const result = await deleteNewsletterDraft(id);
            if (!result.success) {
                setStatusMessage({ type: "error", text: result.error });
                return;
            }
            if (currentId === id) resetEditor();
            router.refresh();
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Navigation & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link href="/admin" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
                            ← חזרה לפאנל ניהול
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">עורך ניוזלטר קהילתי</h1>
                        <p className="text-sm text-slate-500">עריכת תכנים והפצה בתבנית מייל ממותגת</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={isPending}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                            שמירת טיוטה
                        </button>
                        {currentId && (
                            <Link
                                href={`/admin/newsletter/${currentId}/print`}
                                target="_blank"
                                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                            >
                                הדפסה / PDF
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={handleCopyForWhatsApp}
                            disabled={items.length === 0}
                            className="px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-emerald-800 text-xs font-semibold rounded-xl transition-colors"
                        >
                            העתקה לוואטסאפ
                        </button>
                        <button
                            type="button"
                            onClick={handleSendTest}
                            disabled={isPending || !emailConfigured}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                            שליחת בדיקה אליי
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmingSend(true)}
                            disabled={isPending || !emailConfigured || items.length === 0}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                        >
                            שיגור תפוצה לקהילה ✉
                        </button>
                    </div>
                </div>

                {!emailConfigured && (
                    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800">
                        שליחת מיילים אינה מוגדרת עדיין (חסר RESEND_API_KEY) - ניתן לערוך ולשמור טיוטות, אך לא לשלוח.
                    </div>
                )}

                {statusMessage && (
                    <div
                        className={`px-4 py-3 rounded-xl text-xs font-medium border ${statusMessage.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                            }`}
                    >
                        {statusMessage.text}
                    </div>
                )}

                {confirmingSend && (
                    <div className="px-4 py-4 bg-white border border-amber-300 rounded-xl shadow-xs space-y-3">
                        <p className="text-sm font-semibold text-slate-900">
                            לשלוח את הניוזלטר ל-{recipientCount} נמענים רשומים? פעולה זו אינה הפיכה.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleConfirmSend}
                                disabled={isPending}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                {isPending ? "שולח..." : "כן, שלח עכשיו"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmingSend(false)}
                                disabled={isPending}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                )}

                {/* Workspace: Left Editor, Right Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Controls Column */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Delivery Settings */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                                הגדרות תפוצה
                            </h2>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">נושא המייל (Subject)</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">קבוצת תפוצה</label>
                                <select
                                    value={targetGroup}
                                    onChange={(e) => setTargetGroup(e.target.value as typeof targetGroup)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                >
                                    <option value="all">כלל חברי הקהילה הרשומים ({recipientCount})</option>
                                    <option value="board" disabled>ועד מנהל בלבד (בקרוב)</option>
                                    <option value="volunteers" disabled>צוות חסד ואירועים (בקרוב)</option>
                                </select>
                            </div>
                        </div>

                        {/* Modular Items List */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-900">אייטמים בניוזלטר ({items.length})</h2>
                                {!isAddingItem && (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingItem(true)}
                                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors"
                                    >
                                        + הוסף אייטם
                                    </button>
                                )}
                            </div>

                            {/* Add Item Form */}
                            {isAddingItem && (
                                <form onSubmit={handleAddItem} className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                                    <h3 className="text-xs font-bold text-amber-900">אייטם חדש</h3>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700">קטגוריה</label>
                                        <select
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as NewsletterCategory })}
                                            className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{c === "השכבות" ? "השכבות וימי זיכרון" : c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700">כותרת</label>
                                        <input
                                            type="text"
                                            required
                                            value={newItem.title}
                                            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                            className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700">תוכן ההודעה</label>
                                        <textarea
                                            rows={3}
                                            required
                                            value={newItem.body}
                                            onChange={(e) => setNewItem({ ...newItem, body: e.target.value })}
                                            className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-700">קישור לתמונה (אופציונלי)</label>
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={newItem.imageUrl}
                                            onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                            className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setIsAddingItem(false); setNewItem(emptyNewItem); }}
                                            className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                        >
                                            ביטול
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg"
                                        >
                                            הוסף למייל
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Items Reorder / Remove List */}
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <span className="font-semibold text-amber-800 ml-2">[{item.category}]</span>
                                            <span className="font-bold text-slate-800">{item.title}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-rose-600 hover:text-rose-800 font-semibold"
                                        >
                                            מחק
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Past Newsletters */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-900">ניוזלטרים קודמים</h2>
                                {currentId && (
                                    <button
                                        type="button"
                                        onClick={resetEditor}
                                        className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                                    >
                                        + טיוטה חדשה
                                    </button>
                                )}
                            </div>
                            {newsletters.length === 0 ? (
                                <p className="text-xs text-slate-400 py-2">אין עדיין ניוזלטרים שמורים.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {newsletters.map((n) => (
                                        <div key={n.id} className="py-2.5 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="font-semibold text-slate-800">{n.subject}</span>
                                                <span
                                                    className={`mr-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${n.status === "sent"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : n.status === "sending"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : n.status === "failed"
                                                                ? "bg-rose-100 text-rose-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {n.status === "sent"
                                                        ? `נשלח ל-${n.sentCount}`
                                                        : n.status === "sending"
                                                            ? "בשליחה..."
                                                            : n.status === "failed"
                                                                ? `נכשל${n.sentCount ? ` (נשלח ל-${n.sentCount})` : ""}`
                                                                : "טיוטה"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => loadDraft(n)}
                                                    disabled={n.status === "sending"}
                                                    className="text-amber-700 hover:text-amber-800 disabled:text-slate-300 font-semibold"
                                                >
                                                    טעינה
                                                </button>
                                                {(n.status === "draft" || n.status === "failed") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDraft(n.id)}
                                                        className="text-rose-600 hover:text-rose-800 font-semibold"
                                                    >
                                                        מחיקה
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Email Live Preview Column */}
                    <div className="lg:col-span-7">
                        <div className="bg-slate-200/70 p-4 sm:p-6 rounded-3xl border border-slate-300/80 shadow-inner">
                            <div className="text-center pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                תצוגה מקדימה של המייל (Email Client Preview)
                            </div>

                            {/* Simulated Email Canvas */}
                            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200 text-slate-800 font-sans">

                                {/* Email Header */}
                                <div className="bg-amber-800 text-white p-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white text-amber-800 font-extrabold text-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
                                        {LOGO_INITIAL}
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight">{COMMUNITY_NAME}</h2>
                                    <p className="text-amber-200 text-xs mt-1">{subject}</p>
                                </div>

                                {/* Email Content Body */}
                                <div className="p-6 space-y-6 divide-y divide-slate-100">
                                    {items.map((item, index) => (
                                        <div key={index} className="pt-5 first:pt-0 space-y-2">
                                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                                                {item.category}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>

                                            {item.imageUrl && (
                                                <div className="mt-2 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 h-40 flex items-center justify-center text-xs text-slate-400">
                                                    תמונה מצורפת: {item.imageUrl}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {items.length === 0 && (
                                        <p className="text-center text-xs text-slate-400 py-8">
                                            הניוזלטר ריק. הוסף אייטמים משמאל כדי לראותם כאן.
                                        </p>
                                    )}
                                </div>

                                {/* Email Footer */}
                                <div className="bg-slate-50 p-6 text-center border-t border-slate-100 space-y-2 text-xs text-slate-400">
                                    <p className="font-medium text-slate-600">{COMMUNITY_NAME} • {COMMUNITY_ADDRESS_LINE}</p>
                                    <p>נשלח אליך מאחר שאתה רשום בפורטל הקהילה.</p>
                                    <div className="pt-2 text-[10px] text-slate-400">
                                        <span className="underline cursor-pointer">עדכון הגדרות קבלה</span> •{" "}
                                        <span className="underline cursor-pointer">הסרה מרשימת תפוצה</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
