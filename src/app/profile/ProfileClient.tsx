"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HalachicStatus } from "@/types";
import { addYahrzeit, removeYahrzeit, updateProfile } from "@/app/actions/profile";
import { logout } from "@/app/actions/auth";
import { HEBREW_MONTHS, YAHRZEIT_RELATIONS } from "@/lib/yahrzeit";

interface YahrzeitRecord {
    id: string;
    deceasedName: string;
    relation: string;
    hebrewDay: number;
    hebrewMonth: string;
    diedAfterSunset: boolean;
    notes: string | null;
}

interface ProfileMember {
    firstName: string;
    lastName: string;
    halachicStatus: string;
    showPhoneInDirectory: boolean;
    showAddressInDirectory: boolean;
    receiveNewsletter: boolean;
    toddlerChildren: number;
    elementaryChildren: number;
    teenChildren: number;
}

interface DonationRecord {
    id: string;
    amount: number;
    targetFund: string;
    isRecurring: boolean;
    createdAt: Date;
}

interface ProfileClientProps {
    member: ProfileMember;
    yahrzeits: YahrzeitRecord[];
    donations: DonationRecord[];
    totalDonated: number;
}

export default function ProfileClient({ member, yahrzeits, donations, totalDonated }: ProfileClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [halachicStatus, setHalachicStatus] = useState<HalachicStatus>(member.halachicStatus as HalachicStatus);
    const [showPhoneInDirectory, setShowPhoneInDirectory] = useState(member.showPhoneInDirectory);
    const [showAddressInDirectory, setShowAddressInDirectory] = useState(member.showAddressInDirectory);
    const [receiveNewsletter, setReceiveNewsletter] = useState(member.receiveNewsletter);
    const [childrenAges, setChildrenAges] = useState({
        toddler: member.toddlerChildren,
        elementary: member.elementaryChildren,
        teen: member.teenChildren,
    });
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSaveProfile = () => {
        setSaveMessage(null);
        startTransition(async () => {
            const result = await updateProfile({
                halachicStatus,
                showPhoneInDirectory,
                showAddressInDirectory,
                receiveNewsletter,
                toddlerChildren: childrenAges.toddler,
                elementaryChildren: childrenAges.elementary,
                teenChildren: childrenAges.teen,
            });
            if (!result.success) {
                setSaveMessage({ type: "error", text: result.error });
                return;
            }
            setSaveMessage({ type: "success", text: "השינויים נשמרו בהצלחה" });
            router.refresh();
        });
    };

    // Form state for adding a new yahrzeit
    const [newYahrzeit, setNewYahrzeit] = useState({
        deceasedName: "",
        relation: "father",
        day: 1,
        month: "תשרי",
        diedAfterSunset: false,
        notes: "",
    });
    const [isAddingYahrzeit, setIsAddingYahrzeit] = useState(false);
    const [yahrzeitError, setYahrzeitError] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const handleAddYahrzeit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newYahrzeit.deceasedName.trim()) return;

        setYahrzeitError(null);
        startTransition(async () => {
            const result = await addYahrzeit({
                deceasedName: newYahrzeit.deceasedName,
                relation: newYahrzeit.relation,
                hebrewDay: Number(newYahrzeit.day),
                hebrewMonth: newYahrzeit.month,
                diedAfterSunset: newYahrzeit.diedAfterSunset,
                notes: newYahrzeit.notes,
            });
            if (!result.success) {
                setYahrzeitError(result.error);
                return;
            }
            setNewYahrzeit({
                deceasedName: "",
                relation: "father",
                day: 1,
                month: "תשרי",
                diedAfterSunset: false,
                notes: "",
            });
            setIsAddingYahrzeit(false);
            router.refresh();
        });
    };

    const handleRemoveYahrzeit = (id: string) => {
        setRemovingId(id);
        setYahrzeitError(null);
        startTransition(async () => {
            const result = await removeYahrzeit(id);
            if (!result.success) {
                setYahrzeitError(result.error);
                setRemovingId(null);
                return;
            }
            router.refresh();
            setRemovingId(null);
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Top Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
                            ← חזרה לדף הבית
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                            האזור האישי של {member.firstName} {member.lastName}
                        </h1>
                        <p className="text-sm text-slate-500">
                            הפרטים מסייעים לגבאים בשיבוץ עליות, תיאום השכבות ופעילות קהילתית
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={isPending}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                        >
                            {isPending ? "שומר..." : "שמירת כל השינויים"}
                        </button>
                        <button
                            type="button"
                            onClick={() => startTransition(() => logout())}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                        >
                            התנתקות
                        </button>
                    </div>
                </div>

                {saveMessage && (
                    <div
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${saveMessage.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                            }`}
                    >
                        {saveMessage.text}
                    </div>
                )}

                {/* Section 1: Halachic Status & Directory Visibility */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100">
                        מעמד הלכתי והגדרות פרטיות
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                מעמד הלכתי (לצורך סדר עליות בתורה)
                            </label>
                            <select
                                value={halachicStatus}
                                onChange={(e) => setHalachicStatus(e.target.value as HalachicStatus)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                            >
                                <option value="yisrael">ישראל</option>
                                <option value="kohen">כהן</option>
                                <option value="levi">לוי</option>
                            </select>
                        </div>

                        <div className="space-y-3 pt-1">
                            <label className="block text-xs font-medium text-slate-700">
                                הצגת פרטים באלפון הקהילתי
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showPhoneInDirectory}
                                        onChange={(e) => setShowPhoneInDirectory(e.target.checked)}
                                        className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    הצג את מספר הטלפון שלי לחברי הקהילה
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showAddressInDirectory}
                                        onChange={(e) => setShowAddressInDirectory(e.target.checked)}
                                        className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    הצג את כתובת המגורים שלי באלפון
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={receiveNewsletter}
                                        onChange={(e) => setReceiveNewsletter(e.target.checked)}
                                        className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    קבלת ניוזלטר קהילתי במייל
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Children Age Groups */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">ילדים במשפחה</h2>
                        <p className="text-xs text-slate-500">לצורך חלוקת תרגום, לימוד מארי ופעילויות שבת</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                            <label className="block text-xs font-semibold text-slate-600">גיל הרך / פעוטות (0-5)</label>
                            <input
                                type="number"
                                min="0"
                                value={childrenAges.toddler}
                                onChange={(e) => setChildrenAges({ ...childrenAges, toddler: Number(e.target.value) })}
                                className="mt-2 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold"
                            />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                            <label className="block text-xs font-semibold text-slate-600">גיל יסודי / תרגום (6-12)</label>
                            <input
                                type="number"
                                min="0"
                                value={childrenAges.elementary}
                                onChange={(e) => setChildrenAges({ ...childrenAges, elementary: Number(e.target.value) })}
                                className="mt-2 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold"
                            />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                            <label className="block text-xs font-semibold text-slate-600">נוער (13 ומעלה)</label>
                            <input
                                type="number"
                                min="0"
                                value={childrenAges.teen}
                                onChange={(e) => setChildrenAges({ ...childrenAges, teen: Number(e.target.value) })}
                                className="mt-2 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Memorials & Yahrzeits */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">ימי זיכרון והשכבות (יארצייט)</h2>
                            <p className="text-xs text-slate-500">
                                פרטים אלו משמשים את הגבאים לתזכורות, הזכרת נשמות בשבת וקדישים
                            </p>
                        </div>
                        {!isAddingYahrzeit && (
                            <button
                                type="button"
                                onClick={() => setIsAddingYahrzeit(true)}
                                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors"
                            >
                                + הוסף יום זיכרון
                            </button>
                        )}
                    </div>

                    {yahrzeitError && (
                        <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                            {yahrzeitError}
                        </div>
                    )}

                    {/* Add Entry Form */}
                    {isAddingYahrzeit && (
                        <form onSubmit={handleAddYahrzeit} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-4">
                            <h3 className="text-xs font-bold text-amber-900 uppercase">הוספת נפטר/ת חדש/ה</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700">שם הנפטר/ת להשכבה</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="לדוגמה: שלום בן יחיא"
                                        value={newYahrzeit.deceasedName}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, deceasedName: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700">קרבה</label>
                                    <select
                                        value={newYahrzeit.relation}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, relation: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    >
                                        {YAHRZEIT_RELATIONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700">יום עברי</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={newYahrzeit.day}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, day: Number(e.target.value) })}
                                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-700">חודש עברי</label>
                                    <select
                                        value={newYahrzeit.month}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, month: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    >
                                        {HEBREW_MONTHS.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 sm:col-span-1 pb-2">
                                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newYahrzeit.diedAfterSunset}
                                            onChange={(e) => setNewYahrzeit({ ...newYahrzeit, diedAfterSunset: e.target.checked })}
                                            className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        נפטר/ה לאחר השקיעה
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingYahrzeit(false)}
                                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg"
                                >
                                    {isPending ? "מוסיף..." : "הוספה לרשימה"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* List of registered yahrzeits */}
                    <div className="divide-y divide-slate-100">
                        {yahrzeits.map((item) => (
                            <div key={item.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{item.deceasedName}</p>
                                    <p className="text-xs text-slate-500">
                                        {item.hebrewDay} ב{item.hebrewMonth}
                                        {item.diedAfterSunset ? " (לאחר השקיעה)" : ""} • {item.notes || "ללא הערה"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveYahrzeit(item.id)}
                                    disabled={removingId === item.id}
                                    className="text-xs text-rose-600 hover:text-rose-800 disabled:text-slate-400 p-1"
                                >
                                    {removingId === item.id ? "מסיר..." : "הסרה"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: My Donations */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">היסטוריית תרומות</h2>
                            <p className="text-xs text-slate-500">תרומות שסונכרנו ממערכת נדרים פלוס</p>
                        </div>
                        <Link
                            href="/donate"
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors"
                        >
                            תרומה נוספת
                        </Link>
                    </div>

                    {donations.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">
                            עדיין לא נרשמו תרומות תחת כתובת המייל או מספר הטלפון שלך.
                        </p>
                    ) : (
                        <>
                            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                                <span className="text-xs text-emerald-800">סך כל התרומות</span>
                                <p className="text-2xl font-extrabold text-emerald-900">₪{totalDonated.toLocaleString()}</p>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {donations.map((d) => (
                                    <div key={d.id} className="py-2.5 flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-semibold text-slate-800">₪{d.amount.toLocaleString()}</span>
                                            <span className="text-xs text-slate-500 mr-2">{d.targetFund}</span>
                                            {d.isRecurring && (
                                                <span className="mr-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800">
                                                    הוראת קבע
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(d.createdAt).toLocaleDateString("he-IL")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
