"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, CheckCircle2, Circle } from "lucide-react";
import { HalachicStatus } from "@/types";
import { addYahrzeit, removeYahrzeit, updateProfile } from "@/app/actions/profile";
import { HEBREW_MONTHS, YAHRZEIT_RELATIONS } from "@/lib/yahrzeit";
import { LinkButton } from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

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

    // Profile completion checklist: only tracks fields that are optional at
    // registration (firstName/lastName/phone/address are always required, so
    // they're always filled and not worth showing here). Reflects the
    // unsaved form state for children ages so the bar moves as you type,
    // matching a LinkedIn-style "fill this in" nudge rather than the last
    // saved value.
    const totalChildren = childrenAges.toddler + childrenAges.elementary + childrenAges.teen;
    const completionChecks = [
        { label: "פרטי ילדים במשפחה", done: totalChildren > 0 },
        { label: "לפחות יום זיכרון אחד (יארצייט)", done: yahrzeits.length > 0 },
    ];
    const completionPercent = Math.round(
        (completionChecks.filter((c) => c.done).length / completionChecks.length) * 100
    );

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
        <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text">
                            האזור האישי של {member.firstName} {member.lastName}
                        </h1>
                        <p className="text-sm text-text-muted">
                            הפרטים מסייעים לגבאים בשיבוץ עליות, תיאום השכבות ופעילות קהילתית
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isPending}
                        className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-border text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                    >
                        {isPending ? "שומר..." : "שמירת כל השינויים"}
                    </button>
                </div>

                {saveMessage && (
                    <div
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${saveMessage.type === "success"
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-danger-bg border-danger-border text-danger"
                            }`}
                    >
                        {saveMessage.text}
                    </div>
                )}

                {/* Profile Completion Meter */}
                {completionPercent < 100 && (
                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs space-y-3">
                        <ProgressBar percent={completionPercent} label="השלמת הפרופיל" />
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-1">
                            {completionChecks.map((check) => (
                                <span
                                    key={check.label}
                                    className={`flex items-center gap-1.5 text-xs font-medium ${check.done ? "text-success" : "text-text-muted"
                                        }`}
                                >
                                    {check.done ? (
                                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                    ) : (
                                        <Circle className="size-3.5" aria-hidden="true" />
                                    )}
                                    {check.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 1: Halachic Status & Directory Visibility */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-6">
                    <h2 className="text-lg font-bold text-text pb-2 border-b border-border">
                        מעמד הלכתי והגדרות פרטיות
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">
                                מעמד הלכתי (לצורך סדר עליות בתורה)
                            </label>
                            <select
                                value={halachicStatus}
                                onChange={(e) => setHalachicStatus(e.target.value as HalachicStatus)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                            >
                                <option value="yisrael">ישראל</option>
                                <option value="kohen">כהן</option>
                                <option value="levi">לוי</option>
                            </select>
                        </div>

                        <div className="space-y-3 pt-1">
                            <label className="block text-xs font-medium text-text">
                                הצגת פרטים באלפון הקהילתי
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showPhoneInDirectory}
                                        onChange={(e) => setShowPhoneInDirectory(e.target.checked)}
                                        className="rounded-md border-border text-primary focus:ring-primary"
                                    />
                                    הצג את מספר הטלפון שלי לחברי הקהילה
                                </label>
                                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showAddressInDirectory}
                                        onChange={(e) => setShowAddressInDirectory(e.target.checked)}
                                        className="rounded-md border-border text-primary focus:ring-primary"
                                    />
                                    הצג את כתובת המגורים שלי באלפון
                                </label>
                                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={receiveNewsletter}
                                        onChange={(e) => setReceiveNewsletter(e.target.checked)}
                                        className="rounded-md border-border text-primary focus:ring-primary"
                                    />
                                    קבלת ניוזלטר קהילתי במייל
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Children Age Groups */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-text">ילדים במשפחה</h2>
                        <p className="text-xs text-text-muted">לצורך חלוקת תרגום, לימוד מארי ופעילויות שבת</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 bg-background rounded-xl border border-border">
                            <label className="block text-xs font-semibold text-text-muted">גיל הרך / פעוטות (0-5)</label>
                            <input
                                type="number"
                                min="0"
                                value={childrenAges.toddler}
                                onChange={(e) => setChildrenAges({ ...childrenAges, toddler: Number(e.target.value) })}
                                className="mt-2 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-center font-bold"
                            />
                        </div>

                        <div className="p-4 bg-background rounded-xl border border-border">
                            <label className="block text-xs font-semibold text-text-muted">גיל יסודי / תרגום (6-12)</label>
                            <input
                                type="number"
                                min="0"
                                value={childrenAges.elementary}
                                onChange={(e) => setChildrenAges({ ...childrenAges, elementary: Number(e.target.value) })}
                                className="mt-2 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-center font-bold"
                            />
                        </div>

                        <div className="p-4 bg-background rounded-xl border border-border">
                            <label className="block text-xs font-semibold text-text-muted">נוער (13 ומעלה)</label>
                            <input
                                type="number"
                                min="0"
                                value={childrenAges.teen}
                                onChange={(e) => setChildrenAges({ ...childrenAges, teen: Number(e.target.value) })}
                                className="mt-2 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-center font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Memorials & Yahrzeits */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                            <h2 className="text-lg font-bold text-text">ימי זיכרון והשכבות (יארצייט)</h2>
                            <p className="text-xs text-text-muted">
                                פרטים אלו משמשים את הגבאים לתזכורות, הזכרת נשמות בשבת וקדישים
                            </p>
                        </div>
                        {!isAddingYahrzeit && (
                            <button
                                type="button"
                                onClick={() => setIsAddingYahrzeit(true)}
                                className="px-3.5 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent-hover text-xs font-bold rounded-lg transition-colors"
                            >
                                + הוסף יום זיכרון
                            </button>
                        )}
                    </div>

                    {yahrzeitError && (
                        <div className="px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                            {yahrzeitError}
                        </div>
                    )}

                    {/* Add Entry Form */}
                    {isAddingYahrzeit && (
                        <form onSubmit={handleAddYahrzeit} className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-4">
                            <h3 className="text-xs font-bold text-accent-hover uppercase">הוספת נפטר/ת חדש/ה</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-text">שם הנפטר/ת להשכבה</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="לדוגמה: שלום בן יחיא"
                                        value={newYahrzeit.deceasedName}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, deceasedName: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-text">קרבה</label>
                                    <select
                                        value={newYahrzeit.relation}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, relation: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    >
                                        {YAHRZEIT_RELATIONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-text">יום עברי</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={newYahrzeit.day}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, day: Number(e.target.value) })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-text">חודש עברי</label>
                                    <select
                                        value={newYahrzeit.month}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, month: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    >
                                        {HEBREW_MONTHS.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2 sm:col-span-1 pb-2">
                                    <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newYahrzeit.diedAfterSunset}
                                            onChange={(e) => setNewYahrzeit({ ...newYahrzeit, diedAfterSunset: e.target.checked })}
                                            className="rounded-md border-border text-primary focus:ring-primary"
                                        />
                                        נפטר/ה לאחר השקיעה
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingYahrzeit(false)}
                                    className="px-3 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-border text-white text-xs font-bold rounded-lg"
                                >
                                    {isPending ? "מוסיף..." : "הוספה לרשימה"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* List of registered yahrzeits */}
                    <div className="divide-y divide-border">
                        {yahrzeits.map((item) => (
                            <div key={item.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-text">{item.deceasedName}</p>
                                    <p className="text-xs text-text-muted">
                                        {item.hebrewDay} ב{item.hebrewMonth}
                                        {item.diedAfterSunset ? " (לאחר השקיעה)" : ""} • {item.notes || "ללא הערה"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveYahrzeit(item.id)}
                                    disabled={removingId === item.id}
                                    className="text-xs text-danger hover:opacity-80 disabled:text-text-muted p-1"
                                >
                                    {removingId === item.id ? "מסיר..." : "הסרה"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: My Donations */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                            <h2 className="text-lg font-bold text-text">היסטוריית תרומות</h2>
                            <p className="text-xs text-text-muted">תרומות שסונכרנו ממערכת נדרים פלוס</p>
                        </div>
                        <LinkButton href="/donate" variant="ghost" size="sm">
                            <Gift className="size-4" aria-hidden="true" />
                            <span>תרומה נוספת</span>
                        </LinkButton>
                    </div>

                    {donations.length === 0 ? (
                        <p className="text-sm text-text-muted py-4 text-center">
                            עדיין לא נרשמו תרומות תחת כתובת המייל או מספר הטלפון שלך.
                        </p>
                    ) : (
                        <>
                            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                                <span className="text-xs text-primary">סך כל התרומות</span>
                                <p className="text-2xl font-extrabold text-primary">₪{totalDonated.toLocaleString()}</p>
                            </div>
                            <div className="divide-y divide-border">
                                {donations.map((d) => (
                                    <div key={d.id} className="py-2.5 flex items-center justify-between text-sm">
                                        <div>
                                            <span className="font-semibold text-text">₪{d.amount.toLocaleString()}</span>
                                            <span className="text-xs text-text-muted mr-2">{d.targetFund}</span>
                                            {d.isRecurring && (
                                                <span className="mr-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent-hover">
                                                    הוראת קבע
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-text-muted">
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
