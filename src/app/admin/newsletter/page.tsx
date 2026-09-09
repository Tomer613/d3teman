"use client";

import { useState } from "react";
import Link from "next/link";

interface NewsletterItem {
    id: string;
    category: "שמחות" | "הודעת ועד" | "זמני תפילה" | "השכבות";
    title: string;
    body: string;
    imageUrl?: string;
}

export default function NewsletterBuilderPage() {
    const [subject, setSubject] = useState("עלון שבת פרשת יתרו - קהילת תפארת תימן");
    const [targetGroup, setTargetGroup] = useState<"all" | "board" | "volunteers">("all");
    const [items, setItems] = useState<NewsletterItem[]>([
        {
            id: "1",
            category: "שמחות",
            title: "מזל טוב למשפחת שרעבי",
            body: "ברכת הקהילה לרגל הולדת הבן בשעה טובה. לימוד ברית יצחק יתקיים ביום שלישי בבית המשפחה.",
        },
        {
            id: "2",
            category: "הודעת ועד",
            title: "עדכון עבודות שיפוץ עזרת נשים",
            body: "בשעה טובה הסתיימו עבודות הסיוד והתקנת המיזוג החדש לקראת שבתות הקיץ.",
        },
    ]);

    // Modal / form state for adding a new section
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItem, setNewItem] = useState<Omit<NewsletterItem, "id">>({
        category: "הודעת ועד",
        title: "",
        body: "",
        imageUrl: "",
    });

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title || !newItem.body) return;

        setItems([
            ...items,
            {
                id: Date.now().toString(),
                ...newItem,
            },
        ]);

        setNewItem({
            category: "הודעת ועד",
            title: "",
            body: "",
            imageUrl: "",
        });
        setIsAddingItem(false);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handleSendBroadcast = () => {
        const groupName =
            targetGroup === "all"
                ? "כלל חברי הקהילה"
                : targetGroup === "board"
                    ? "הוועד המנהל"
                    : "צוות מתנדבים";
        alert(`הניוזלטר נשלח בהצלחה אל: ${groupName} (${items.length} אייטמים)`);
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

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => alert("טיוטת בדיקה נשלחה לכתובת המייל שלך")}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                            שליחת בדיקה אליי
                        </button>
                        <button
                            type="button"
                            onClick={handleSendBroadcast}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                        >
                            שיגור תפוצה לקהילה ✉
                        </button>
                    </div>
                </div>

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
                                    onChange={(e) => setTargetGroup(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                >
                                    <option value="all">כלל חברי הקהילה (68 משפחות)</option>
                                    <option value="board">ועד מנהל בלבד (5 חברים)</option>
                                    <option value="volunteers">צוות חסד ואירועים (12 חברים)</option>
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
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                                            className="mt-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                        >
                                            <option value="שמחות">שמחות</option>
                                            <option value="הודעת ועד">הודעת ועד</option>
                                            <option value="זמני תפילה">זמני תפילה</option>
                                            <option value="השכבות">השכבות וימי זיכרון</option>
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
                                            onClick={() => setIsAddingItem(false)}
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
                                        key={item.id}
                                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <span className="font-semibold text-amber-800 ml-2">[{item.category}]</span>
                                            <span className="font-bold text-slate-800">{item.title}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-rose-600 hover:text-rose-800 font-semibold"
                                        >
                                            מחק
                                        </button>
                                    </div>
                                ))}
                            </div>
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
                                        ת
                                    </div>
                                    <h2 className="text-xl font-bold tracking-tight">קהילת תפארת תימן</h2>
                                    <p className="text-amber-200 text-xs mt-1">{subject}</p>
                                </div>

                                {/* Email Content Body */}
                                <div className="p-6 space-y-6 divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <div key={item.id} className="pt-5 first:pt-0 space-y-2">
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
                                    <p className="font-medium text-slate-600">קהילת תפארת תימן • רחוב שבזי, בני ברק</p>
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