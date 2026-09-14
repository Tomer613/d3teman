"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, CheckCircle2, Circle } from "lucide-react";
import { HalachicStatus } from "@/types";
import { addYahrzeit, removeYahrzeit, updateProfile } from "@/app/actions/profile";
import { submitKiddushDonationRequest, submitHaftarahRequest } from "@/app/actions/requests";
import { HEBREW_MONTHS, YAHRZEIT_RELATIONS } from "@/lib/yahrzeit";
import { LinkButton } from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";

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
    phone: string;
    street: string;
    city: string;
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

interface KiddushRequestRecord {
    id: string;
    occasion: string;
    preferredDate: string;
    amount: number | null;
    status: string;
    createdAt: Date;
}

interface HaftarahRequestRecord {
    id: string;
    parsha: string;
    occasion: string | null;
    status: string;
    createdAt: Date;
}

interface ProfileClientProps {
    member: ProfileMember;
    yahrzeits: YahrzeitRecord[];
    donations: DonationRecord[];
    totalDonated: number;
    kiddushRequests: KiddushRequestRecord[];
    haftarahRequests: HaftarahRequestRecord[];
}

const STATUS_LABELS: Record<string, { label: string; variant: "neutral" | "success" | "danger" }> = {
    pending: { label: "ממתין לאישור", variant: "neutral" },
    approved: { label: "אושר", variant: "success" },
    rejected: { label: "נדחה", variant: "danger" },
};

export default function ProfileClient({
    member,
    yahrzeits,
    donations,
    totalDonated,
    kiddushRequests,
    haftarahRequests,
}: ProfileClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [firstName, setFirstName] = useState(member.firstName);
    const [lastName, setLastName] = useState(member.lastName);
    const [phone, setPhone] = useState(member.phone);
    const [street, setStreet] = useState(member.street);
    const [city, setCity] = useState(member.city);
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

    // Profile completion checklist: covers both fields that are optional at
    // registration (children, yahrzeit) and fields that ARE required at
    // registration but can still end up empty (a gabay can create/edit a
    // member record outside the join-request flow). Reflects unsaved form
    // state so the bar - and each item's checkmark - moves as you type,
    // matching a LinkedIn-style "fill this in" nudge rather than the last
    // saved value.
    const totalChildren = childrenAges.toddler + childrenAges.elementary + childrenAges.teen;
    const completionChecks = [
        { label: "שם פרטי", done: firstName.trim().length > 0 },
        { label: "שם משפחה", done: lastName.trim().length > 0 },
        { label: "טלפון", done: phone.trim().length > 0 },
        { label: "רחוב", done: street.trim().length > 0 },
        { label: "עיר", done: city.trim().length > 0 },
        { label: "פרטי ילדים במשפחה", done: totalChildren > 0 },
        { label: "לפחות יום זיכרון אחד (יארצייט)", done: yahrzeits.length > 0 },
    ];
    const completionPercent = Math.round(
        (completionChecks.filter((c) => c.done).length / completionChecks.length) * 100
    );

    // Items that just flipped to "done" stay visible (with their checkmark)
    // for 3s before being filtered out of the list below, instead of
    // vanishing the instant they're completed. Driven by a diff against the
    // previous render's done-map, so it works the same whether "done" comes
    // from live local state (personal fields, children) or a server prop
    // (yahrzeits) - and an item that's already done when the page first
    // loads never flashes, since there's no false->true transition to catch.
    const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
    const prevDoneRef = useRef<Record<string, boolean>>({});
    const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        for (const check of completionChecks) {
            const wasDone = prevDoneRef.current[check.label] ?? false;
            if (check.done && !wasDone) {
                setRecentlyCompleted((prev) => new Set(prev).add(check.label));
                clearTimeout(timersRef.current[check.label]);
                timersRef.current[check.label] = setTimeout(() => {
                    setRecentlyCompleted((prev) => {
                        const next = new Set(prev);
                        next.delete(check.label);
                        return next;
                    });
                }, 3000);
            }
            prevDoneRef.current[check.label] = check.done;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completionChecks.map((c) => `${c.label}:${c.done}`).join(",")]);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

    const displayedChecks = completionChecks.filter((c) => !c.done || recentlyCompleted.has(c.label));

    const handleSaveProfile = () => {
        setSaveMessage(null);
        startTransition(async () => {
            const result = await updateProfile({
                firstName,
                lastName,
                phone,
                street,
                city,
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

    // Kiddush donation request form
    const [isKiddushFormOpen, setIsKiddushFormOpen] = useState(false);
    const [kiddushForm, setKiddushForm] = useState({ occasion: "", preferredDate: "", amount: "", notes: "" });
    const [kiddushError, setKiddushError] = useState<string | null>(null);
    const [isSubmittingKiddush, startSubmittingKiddush] = useTransition();

    const handleSubmitKiddush = (e: React.FormEvent) => {
        e.preventDefault();
        setKiddushError(null);
        startSubmittingKiddush(async () => {
            const result = await submitKiddushDonationRequest({
                occasion: kiddushForm.occasion,
                preferredDate: kiddushForm.preferredDate,
                amount: kiddushForm.amount ? Number(kiddushForm.amount) : undefined,
                notes: kiddushForm.notes,
            });
            if (!result.success) {
                setKiddushError(result.error);
                return;
            }
            setKiddushForm({ occasion: "", preferredDate: "", amount: "", notes: "" });
            setIsKiddushFormOpen(false);
            router.refresh();
        });
    };

    // Haftarah reservation request form
    const [isHaftarahFormOpen, setIsHaftarahFormOpen] = useState(false);
    const [haftarahForm, setHaftarahForm] = useState({ parsha: "", occasion: "", notes: "" });
    const [haftarahError, setHaftarahError] = useState<string | null>(null);
    const [isSubmittingHaftarah, startSubmittingHaftarah] = useTransition();

    const handleSubmitHaftarah = (e: React.FormEvent) => {
        e.preventDefault();
        setHaftarahError(null);
        startSubmittingHaftarah(async () => {
            const result = await submitHaftarahRequest({
                parsha: haftarahForm.parsha,
                occasion: haftarahForm.occasion,
                notes: haftarahForm.notes,
            });
            if (!result.success) {
                setHaftarahError(result.error);
                return;
            }
            setHaftarahForm({ parsha: "", occasion: "", notes: "" });
            setIsHaftarahFormOpen(false);
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
                {displayedChecks.length > 0 && (
                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs space-y-3">
                        <ProgressBar percent={completionPercent} label="השלמת הפרופיל" />
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-1">
                            {displayedChecks.map((check) => (
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

                {/* Section 0: Personal Details */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-text">פרטים אישיים</h2>
                        <p className="text-xs text-text-muted">הפרטים המלאים שלך במערכת - ניתן לערוך בכל עת</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">שם פרטי</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">שם משפחה</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">טלפון</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">רחוב ומספר בית</label>
                            <input
                                type="text"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text mb-1">עיר</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                            />
                        </div>
                    </div>
                </div>

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

                {/* Section 5: Requests to the gabay */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-text">בקשות ופניות לגבאי</h2>
                        <p className="text-xs text-text-muted">
                            הבקשות יישלחו לצוות הגבאים לאישור, ויוצגו כאן עם הסטטוס העדכני
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setIsKiddushFormOpen((open) => !open)}
                            className="px-3.5 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent-hover text-xs font-bold rounded-lg transition-colors"
                        >
                            + תרום קידוש
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsHaftarahFormOpen((open) => !open)}
                            className="px-3.5 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent-hover text-xs font-bold rounded-lg transition-colors"
                        >
                            + שריין הפטרה
                        </button>
                    </div>

                    {isKiddushFormOpen && (
                        <form onSubmit={handleSubmitKiddush} className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                            <h3 className="text-xs font-bold text-accent-hover uppercase">בקשת תרומת קידוש</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-text">סיבת התרומה</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="לדוגמה: יום הולדת, יארצייט, שמחה משפחתית"
                                        value={kiddushForm.occasion}
                                        onChange={(e) => setKiddushForm({ ...kiddushForm, occasion: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text">שבת מבוקשת</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="לדוגמה: פרשת בשלח, כ״ג בשבט"
                                        value={kiddushForm.preferredDate}
                                        onChange={(e) => setKiddushForm({ ...kiddushForm, preferredDate: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">סכום משוער (אופציונלי)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={kiddushForm.amount}
                                    onChange={(e) => setKiddushForm({ ...kiddushForm, amount: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">הערות נוספות</label>
                                <textarea
                                    rows={2}
                                    value={kiddushForm.notes}
                                    onChange={(e) => setKiddushForm({ ...kiddushForm, notes: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            {kiddushError && (
                                <div className="px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                                    {kiddushError}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsKiddushFormOpen(false)}
                                    className="px-3 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingKiddush}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-border text-white text-xs font-bold rounded-lg"
                                >
                                    {isSubmittingKiddush ? "שולח..." : "שליחת בקשה"}
                                </button>
                            </div>
                        </form>
                    )}

                    {isHaftarahFormOpen && (
                        <form onSubmit={handleSubmitHaftarah} className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                            <h3 className="text-xs font-bold text-accent-hover uppercase">בקשת שריון הפטרה</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-text">פרשה / מועד מבוקש</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="לדוגמה: פרשת יתרו"
                                        value={haftarahForm.parsha}
                                        onChange={(e) => setHaftarahForm({ ...haftarahForm, parsha: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text">סיבה (אופציונלי)</label>
                                    <input
                                        type="text"
                                        placeholder="לדוגמה: בר מצווה, יארצייט"
                                        value={haftarahForm.occasion}
                                        onChange={(e) => setHaftarahForm({ ...haftarahForm, occasion: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">הערות נוספות</label>
                                <textarea
                                    rows={2}
                                    value={haftarahForm.notes}
                                    onChange={(e) => setHaftarahForm({ ...haftarahForm, notes: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            {haftarahError && (
                                <div className="px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                                    {haftarahError}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsHaftarahFormOpen(false)}
                                    className="px-3 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingHaftarah}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-border text-white text-xs font-bold rounded-lg"
                                >
                                    {isSubmittingHaftarah ? "שולח..." : "שליחת בקשה"}
                                </button>
                            </div>
                        </form>
                    )}

                    {(kiddushRequests.length > 0 || haftarahRequests.length > 0) && (
                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-text-muted uppercase mb-2">הבקשות האחרונות שלי</h3>
                            <div className="divide-y divide-border">
                                {kiddushRequests.map((r) => (
                                    <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-text">תרומת קידוש</span>
                                            <span className="text-xs text-text-muted mr-2">
                                                {r.occasion} · {r.preferredDate}
                                            </span>
                                        </div>
                                        <Badge variant={STATUS_LABELS[r.status]?.variant ?? "neutral"}>
                                            {STATUS_LABELS[r.status]?.label ?? r.status}
                                        </Badge>
                                    </div>
                                ))}
                                {haftarahRequests.map((r) => (
                                    <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-text">שריון הפטרה</span>
                                            <span className="text-xs text-text-muted mr-2">{r.parsha}</span>
                                        </div>
                                        <Badge variant={STATUS_LABELS[r.status]?.variant ?? "neutral"}>
                                            {STATUS_LABELS[r.status]?.label ?? r.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
