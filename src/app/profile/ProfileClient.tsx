"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, CheckCircle2, Circle, UserCircle2 } from "lucide-react";
import { HalachicStatus } from "@/types";
import { addYahrzeit, removeYahrzeit, updateProfile } from "@/app/actions/profile";
import {
    submitKiddushDonationRequest,
    submitHaftarahRequest,
    submitEventNotification,
    submitGeneralInquiry,
    submitAliyahRequest,
} from "@/app/actions/requests";
import { HEBREW_MONTHS, YAHRZEIT_RELATIONS, HEBREW_DAYS, getHebrewDayLabel } from "@/lib/yahrzeit";
import { LinkButton } from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge from "@/components/ui/Badge";

interface YahrzeitRecord {
    id: string;
    deceasedName: string;
    relation: string;
    hebrewDay: number;
    hebrewMonth: string;
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

interface EventNotificationRecord {
    id: string;
    category: string;
    eventType: string;
    eventDate: Date;
    status: string;
    createdAt: Date;
}

interface GeneralInquiryRecord {
    id: string;
    subject: string;
    status: string;
    createdAt: Date;
}

interface AliyahRequestRecord {
    id: string;
    parsha: string;
    aliyahType: string;
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
    eventNotifications: EventNotificationRecord[];
    generalInquiries: GeneralInquiryRecord[];
    aliyahRequests: AliyahRequestRecord[];
}

const EVENT_CATEGORY_OPTIONS: { value: string; label: string; eventTypes: { value: string; label: string }[] }[] = [
    {
        value: "simcha",
        label: "שמחה",
        eventTypes: [
            { value: "birth", label: "לידה" },
            { value: "bar_bat_mitzvah", label: "בר/בת מצווה" },
            { value: "wedding", label: "חתונה" },
            { value: "other", label: "אחר" },
        ],
    },
    {
        value: "aveilut",
        label: "אבלות",
        eventTypes: [
            { value: "loss", label: "פטירה" },
            { value: "yahrzeit", label: "יארצייט" },
            { value: "other", label: "אחר" },
        ],
    },
];

const ALIYAH_TYPE_OPTIONS = [
    { value: "no_preference", label: "ללא העדפה" },
    { value: "shlishi", label: "שלישי" },
    { value: "revii", label: "רביעי" },
    { value: "chamishi", label: "חמישי" },
    { value: "shishi", label: "שישי" },
    { value: "shevii", label: "שביעי" },
    { value: "maftir", label: "מפטיר" },
];

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
    eventNotifications,
    generalInquiries,
    aliyahRequests,
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

    // Whether the "save all changes" button should show at all - only once
    // any field diverges from the last-saved member record, so the button
    // isn't dangling there begging to be clicked when nothing changed.
    const isDirty =
        firstName !== member.firstName ||
        lastName !== member.lastName ||
        phone !== member.phone ||
        street !== member.street ||
        city !== member.city ||
        halachicStatus !== member.halachicStatus ||
        showPhoneInDirectory !== member.showPhoneInDirectory ||
        showAddressInDirectory !== member.showAddressInDirectory ||
        receiveNewsletter !== member.receiveNewsletter ||
        childrenAges.toddler !== member.toddlerChildren ||
        childrenAges.elementary !== member.elementaryChildren ||
        childrenAges.teen !== member.teenChildren;

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

    // Which single gabay-request form is open, tab-style - opening one closes
    // any other, instead of letting them stack up the card indefinitely.
    const [openRequestForm, setOpenRequestForm] = useState<
        "kiddush" | "haftarah" | "aliyah" | "event" | "inquiry" | null
    >(null);

    // Kiddush donation request form
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
            setOpenRequestForm(null);
            router.refresh();
        });
    };

    // Haftarah reservation request form
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
            setOpenRequestForm(null);
            router.refresh();
        });
    };

    // Aliyah request form
    const [aliyahForm, setAliyahForm] = useState({ parsha: "", aliyahType: "no_preference", occasion: "", notes: "" });
    const [aliyahError, setAliyahError] = useState<string | null>(null);
    const [isSubmittingAliyah, startSubmittingAliyah] = useTransition();

    const handleSubmitAliyah = (e: React.FormEvent) => {
        e.preventDefault();
        setAliyahError(null);
        startSubmittingAliyah(async () => {
            const result = await submitAliyahRequest({
                parsha: aliyahForm.parsha,
                aliyahType: aliyahForm.aliyahType,
                occasion: aliyahForm.occasion,
                notes: aliyahForm.notes,
            });
            if (!result.success) {
                setAliyahError(result.error);
                return;
            }
            setAliyahForm({ parsha: "", aliyahType: "no_preference", occasion: "", notes: "" });
            setOpenRequestForm(null);
            router.refresh();
        });
    };

    // Event notification form (simcha / aveilut)
    const [eventForm, setEventForm] = useState({
        category: "simcha",
        eventType: "birth",
        description: "",
        eventDate: "",
        notes: "",
    });
    const [eventError, setEventError] = useState<string | null>(null);
    const [isSubmittingEvent, startSubmittingEvent] = useTransition();

    const handleEventCategoryChange = (category: string) => {
        const firstEventType = EVENT_CATEGORY_OPTIONS.find((c) => c.value === category)?.eventTypes[0]?.value ?? "";
        setEventForm({ ...eventForm, category, eventType: firstEventType });
    };

    const handleSubmitEvent = (e: React.FormEvent) => {
        e.preventDefault();
        setEventError(null);
        startSubmittingEvent(async () => {
            const result = await submitEventNotification({
                category: eventForm.category,
                eventType: eventForm.eventType,
                description: eventForm.description,
                eventDate: eventForm.eventDate,
                notes: eventForm.notes,
            });
            if (!result.success) {
                setEventError(result.error);
                return;
            }
            setEventForm({ category: "simcha", eventType: "birth", description: "", eventDate: "", notes: "" });
            setOpenRequestForm(null);
            router.refresh();
        });
    };

    // General inquiry form
    const [inquiryForm, setInquiryForm] = useState({ subject: "", message: "" });
    const [inquiryError, setInquiryError] = useState<string | null>(null);
    const [isSubmittingInquiry, startSubmittingInquiry] = useTransition();

    const handleSubmitInquiry = (e: React.FormEvent) => {
        e.preventDefault();
        setInquiryError(null);
        startSubmittingInquiry(async () => {
            const result = await submitGeneralInquiry({
                subject: inquiryForm.subject,
                message: inquiryForm.message,
            });
            if (!result.success) {
                setInquiryError(result.error);
                return;
            }
            setInquiryForm({ subject: "", message: "" });
            setOpenRequestForm(null);
            router.refresh();
        });
    };

    // Form state for adding a new yahrzeit
    const [newYahrzeit, setNewYahrzeit] = useState({
        deceasedName: "",
        relation: "father",
        day: 1,
        month: "תשרי",
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
                    {(isDirty || isPending) && (
                        <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={isPending}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-border text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
                        >
                            {isPending ? "שומר..." : "שמירת כל השינויים"}
                        </button>
                    )}
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

                {/* Section: Requests to the gabay */}
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
                            onClick={() => setOpenRequestForm((f) => (f === "kiddush" ? null : "kiddush"))}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${openRequestForm === "kiddush" ? "bg-accent/20 text-accent-hover" : "bg-accent/10 hover:bg-accent/20 text-accent-hover"}`}
                        >
                            + תרום קידוש
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenRequestForm((f) => (f === "haftarah" ? null : "haftarah"))}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${openRequestForm === "haftarah" ? "bg-accent/20 text-accent-hover" : "bg-accent/10 hover:bg-accent/20 text-accent-hover"}`}
                        >
                            + שריין הפטרה
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenRequestForm((f) => (f === "aliyah" ? null : "aliyah"))}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${openRequestForm === "aliyah" ? "bg-accent/20 text-accent-hover" : "bg-accent/10 hover:bg-accent/20 text-accent-hover"}`}
                        >
                            + בקש עלייה
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenRequestForm((f) => (f === "event" ? null : "event"))}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${openRequestForm === "event" ? "bg-accent/20 text-accent-hover" : "bg-accent/10 hover:bg-accent/20 text-accent-hover"}`}
                        >
                            + עדכון על אירוע
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenRequestForm((f) => (f === "inquiry" ? null : "inquiry"))}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${openRequestForm === "inquiry" ? "bg-accent/20 text-accent-hover" : "bg-accent/10 hover:bg-accent/20 text-accent-hover"}`}
                        >
                            + פנייה כללית
                        </button>
                    </div>

                    {openRequestForm === "kiddush" && (
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
                                    onClick={() => setOpenRequestForm(null)}
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

                    {openRequestForm === "haftarah" && (
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
                                    onClick={() => setOpenRequestForm(null)}
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

                    {openRequestForm === "aliyah" && (
                        <form onSubmit={handleSubmitAliyah} className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                            <h3 className="text-xs font-bold text-accent-hover uppercase">בקשת עלייה לתורה</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-text">פרשה / שבת מבוקשת</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="לדוגמה: פרשת יתרו"
                                        value={aliyahForm.parsha}
                                        onChange={(e) => setAliyahForm({ ...aliyahForm, parsha: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text">עלייה מבוקשת</label>
                                    <select
                                        value={aliyahForm.aliyahType}
                                        onChange={(e) => setAliyahForm({ ...aliyahForm, aliyahType: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    >
                                        {ALIYAH_TYPE_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">סיבה (אופציונלי)</label>
                                <input
                                    type="text"
                                    placeholder="לדוגמה: בר מצווה, יארצייט"
                                    value={aliyahForm.occasion}
                                    onChange={(e) => setAliyahForm({ ...aliyahForm, occasion: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">הערות נוספות</label>
                                <textarea
                                    rows={2}
                                    value={aliyahForm.notes}
                                    onChange={(e) => setAliyahForm({ ...aliyahForm, notes: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            {aliyahError && (
                                <div className="px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                                    {aliyahError}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenRequestForm(null)}
                                    className="px-3 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingAliyah}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-border text-white text-xs font-bold rounded-lg"
                                >
                                    {isSubmittingAliyah ? "שולח..." : "שליחת בקשה"}
                                </button>
                            </div>
                        </form>
                    )}

                    {openRequestForm === "event" && (
                        <form onSubmit={handleSubmitEvent} className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                            <h3 className="text-xs font-bold text-accent-hover uppercase">עדכון על אירוע שמחה או אבלות</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-text">סוג האירוע</label>
                                    <select
                                        value={eventForm.category}
                                        onChange={(e) => handleEventCategoryChange(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    >
                                        {EVENT_CATEGORY_OPTIONS.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text">פרטי הסוג</label>
                                    <select
                                        value={eventForm.eventType}
                                        onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    >
                                        {EVENT_CATEGORY_OPTIONS.find((c) => c.value === eventForm.category)?.eventTypes.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">תאריך האירוע</label>
                                <input
                                    type="date"
                                    required
                                    value={eventForm.eventDate}
                                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">פרטי האירוע</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="לדוגמה: נולד לנו בן, לרגל בר המצווה של..."
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">הערות נוספות (אופציונלי)</label>
                                <textarea
                                    rows={2}
                                    value={eventForm.notes}
                                    onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            {eventError && (
                                <div className="px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                                    {eventError}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenRequestForm(null)}
                                    className="px-3 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingEvent}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-border text-white text-xs font-bold rounded-lg"
                                >
                                    {isSubmittingEvent ? "שולח..." : "שליחת עדכון"}
                                </button>
                            </div>
                        </form>
                    )}

                    {openRequestForm === "inquiry" && (
                        <form onSubmit={handleSubmitInquiry} className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-3">
                            <h3 className="text-xs font-bold text-accent-hover uppercase">פנייה כללית לגבאי</h3>

                            <div>
                                <label className="block text-xs font-medium text-text">נושא הפנייה</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="לדוגמה: בקשה למקום חניה, שאלה על שיעור תורה"
                                    value={inquiryForm.subject}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text">תוכן הפנייה</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="פרטו כאן את בקשתכם או שאלתכם..."
                                    value={inquiryForm.message}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                />
                            </div>

                            {inquiryError && (
                                <div className="px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                                    {inquiryError}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenRequestForm(null)}
                                    className="px-3 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingInquiry}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-border text-white text-xs font-bold rounded-lg"
                                >
                                    {isSubmittingInquiry ? "שולח..." : "שליחת פנייה"}
                                </button>
                            </div>
                        </form>
                    )}

                    {(kiddushRequests.length > 0 || haftarahRequests.length > 0 || aliyahRequests.length > 0 || eventNotifications.length > 0 || generalInquiries.length > 0) && (
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
                                {aliyahRequests.map((r) => (
                                    <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-text">בקשת עלייה</span>
                                            <span className="text-xs text-text-muted mr-2">{r.parsha}</span>
                                        </div>
                                        <Badge variant={STATUS_LABELS[r.status]?.variant ?? "neutral"}>
                                            {STATUS_LABELS[r.status]?.label ?? r.status}
                                        </Badge>
                                    </div>
                                ))}
                                {eventNotifications.map((r) => (
                                    <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-text">עדכון אירוע</span>
                                            <span className="text-xs text-text-muted mr-2">
                                                {EVENT_CATEGORY_OPTIONS.find((c) => c.value === r.category)?.label ?? r.category} ·{" "}
                                                {new Date(r.eventDate).toLocaleDateString("he-IL")}
                                            </span>
                                        </div>
                                        <Badge variant={STATUS_LABELS[r.status]?.variant ?? "neutral"}>
                                            {STATUS_LABELS[r.status]?.label ?? r.status}
                                        </Badge>
                                    </div>
                                ))}
                                {generalInquiries.map((r) => (
                                    <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                                        <div className="min-w-0">
                                            <span className="font-semibold text-text">פנייה כללית</span>
                                            <span className="text-xs text-text-muted mr-2">{r.subject}</span>
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

                {/* Section: Halachic Status */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-text">מעמד הלכתי</h2>
                        <p className="text-xs text-text-muted">לצורך סדר עליות בתורה</p>
                    </div>
                    <div>
                        <select
                            value={halachicStatus}
                            onChange={(e) => setHalachicStatus(e.target.value as HalachicStatus)}
                            className="w-full sm:w-1/2 px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
                        >
                            <option value="yisrael">ישראל</option>
                            <option value="kohen">כהן</option>
                            <option value="levi">לוי</option>
                        </select>
                    </div>
                </div>

                {/* Section: My Donations */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                            <h2 className="text-lg font-bold text-text">היסטוריית תרומות</h2>
                            <p className="text-xs text-text-muted">תרומות שסונכרנו ממערכת נדרים פלוס</p>
                        </div>
                        <LinkButton href="/donate" variant="secondary" size="sm">
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

                {/* Section: Privacy Settings */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-text">הגדרות פרטיות</h2>
                        <p className="text-xs text-text-muted">שליטה על מה שמוצג לחברי הקהילה באלפון ובתקשורת</p>
                    </div>
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

                {/* Decorative divider marking the start of the saved-profile region */}
                <div className="flex items-center gap-3 py-1" aria-hidden="true">
                    <div className="h-px flex-1 bg-border" />
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted tracking-wide">
                        <UserCircle2 className="size-3.5 text-accent" />
                        הפרופיל שלי
                    </span>
                    <div className="h-px flex-1 bg-border" />
                </div>

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

                {/* Section: Personal Details */}
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
                                    <label className="block text-xs font-medium text-text">זיקה</label>
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

                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-text">יום עברי</label>
                                    <select
                                        value={newYahrzeit.day}
                                        onChange={(e) => setNewYahrzeit({ ...newYahrzeit, day: Number(e.target.value) })}
                                        className="mt-1 w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                                    >
                                        {HEBREW_DAYS.map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
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
                                        {getHebrewDayLabel(item.hebrewDay)} ב{item.hebrewMonth} • {item.notes || "ללא הערה"}
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

            </div>
        </div>
    );
}
