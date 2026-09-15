"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PartyPopper, Mail, Users, ClipboardList } from "lucide-react";
import {
    approveJoinRequest,
    rejectJoinRequest,
    updateMemberRole,
    setMemberApproval,
    resetMemberPassword,
} from "@/app/actions/admin";
import { LinkButton } from "@/components/ui/Button";
import JoinRequestCard, { type PendingRequest } from "./JoinRequestCard";

interface MemberRecord {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    halachicStatus: string;
    role: string;
    isApproved: boolean;
}

interface FamilyRecord {
    id: string;
    headFirstName: string;
    headLastName: string;
}

const ROLE_LABELS: Record<string, string> = {
    member: "חבר",
    gabay: "גבאי",
    super_admin: "מנהל על",
};

interface TransactionRecord {
    id: string;
    clientName: string;
    amount: number;
    targetFund: string;
    isRecurring: boolean;
    createdAt: Date;
}

interface FundBreakdownEntry {
    targetFund: string;
    total: number;
}

interface AdminDashboardClientProps {
    pendingRequests: PendingRequest[];
    members: MemberRecord[];
    families: FamilyRecord[];
    transactions: TransactionRecord[];
    totalIncome: number;
    fundBreakdown: FundBreakdownEntry[];
    recurringCount: number;
    viewerRole: string;
    viewerId: string;
    emailConfigured: boolean;
    pendingMemberRequestsCount: number;
}

// Generates a random, readable initial password for a newly-approved member.
// This is only ever used for one-time on-screen display - the server hashes
// it before it reaches the database.
function generateInitialPassword() {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

export default function AdminDashboardClient({
    pendingRequests,
    members,
    families,
    transactions,
    totalIncome,
    fundBreakdown,
    recurringCount,
    viewerRole,
    viewerId,
    emailConfigured,
    pendingMemberRequestsCount,
}: AdminDashboardClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [pendingApproval, setPendingApproval] = useState<{ id: string; password: string; familyId: string } | null>(null);
    const [approveError, setApproveError] = useState<string | null>(null);
    const [rejectError, setRejectError] = useState<string | null>(null);
    const [memberActionError, setMemberActionError] = useState<string | null>(null);
    const [resetPasswordResult, setResetPasswordResult] = useState<{ name: string; password: string } | null>(null);
    const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

    const handleRoleChange = (memberId: string, newRole: string) => {
        setMemberActionError(null);
        startTransition(async () => {
            const result = await updateMemberRole(memberId, newRole);
            if (!result.success) {
                setMemberActionError(result.error);
                return;
            }
            router.refresh();
        });
    };

    const handleToggleApproval = (memberId: string, isApproved: boolean) => {
        setMemberActionError(null);
        startTransition(async () => {
            const result = await setMemberApproval(memberId, !isApproved);
            if (!result.success) {
                setMemberActionError(result.error);
                return;
            }
            router.refresh();
        });
    };

    const handleResetPassword = (memberId: string, memberName: string) => {
        setResetPasswordError(null);
        setProcessingId(memberId);
        startTransition(async () => {
            const result = await resetMemberPassword(memberId);
            if (!result.success) {
                setResetPasswordError(result.error);
                setProcessingId(null);
                return;
            }
            setResetPasswordResult({ name: memberName, password: result.password });
            setProcessingId(null);
        });
    };

    const handleStartApprove = (id: string) => {
        setApproveError(null);
        setPendingApproval({ id, password: generateInitialPassword(), familyId: "" });
    };

    const handleCancelApprove = () => {
        setApproveError(null);
        setPendingApproval(null);
    };

    const handleConfirmApprove = (id: string, password: string, familyId: string) => {
        setProcessingId(id);
        setApproveError(null);
        startTransition(async () => {
            const result = await approveJoinRequest(id, password, familyId || undefined);
            if (!result.success) {
                // Keep the password panel open so the admin can retry -
                // dismissing it here would lose the one-time password.
                setApproveError(result.error);
                setProcessingId(null);
                return;
            }
            setPendingApproval(null);
            router.refresh();
            setProcessingId(null);
        });
    };

    const handleReject = (id: string) => {
        setProcessingId(id);
        setRejectError(null);
        startTransition(async () => {
            const result = await rejectJoinRequest(id);
            if (!result.success) {
                setRejectError(result.error);
                setProcessingId(null);
                return;
            }
            router.refresh();
            setProcessingId(null);
        });
    };

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-accent/10 text-accent-hover rounded-full">
                                {ROLE_LABELS[viewerRole] ?? viewerRole}
                            </span>
                            <h1 className="text-xl font-bold text-text">לוח ניהול קהילתי</h1>
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                            אישור מצטרפים חדשים, מעקב גבייה וסנכרון תרומות
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <LinkButton href="/admin/requests" variant="secondary" size="sm">
                            <ClipboardList className="size-4" aria-hidden="true" />
                            <span>בקשות חברים{pendingMemberRequestsCount > 0 ? ` (${pendingMemberRequestsCount})` : ""}</span>
                        </LinkButton>
                        <LinkButton href="/admin/events" variant="secondary" size="sm">
                            <PartyPopper className="size-4" aria-hidden="true" />
                            <span>אירועים ושמחות</span>
                        </LinkButton>
                        <LinkButton href="/admin/newsletter" variant="secondary" size="sm">
                            <Mail className="size-4" aria-hidden="true" />
                            <span>ניוזלטר</span>
                        </LinkButton>
                        <LinkButton href="/directory" variant="secondary" size="sm">
                            <Users className="size-4" aria-hidden="true" />
                            <span>ספר הקהילה</span>
                        </LinkButton>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs">
                        <div className="text-xs text-text-muted">בקשות ממתינות לאישור</div>
                        <div className="text-2xl font-bold text-accent mt-1">{pendingRequests.length}</div>
                    </div>
                    <Link href="/admin/requests" className="bg-surface p-5 rounded-2xl border border-border shadow-xs hover:bg-background/50 transition-colors">
                        <div className="text-xs text-text-muted">בקשות חברים ממתינות</div>
                        <div className="text-2xl font-bold text-accent mt-1">{pendingMemberRequestsCount}</div>
                    </Link>
                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs">
                        <div className="text-xs text-text-muted">חברי קהילה רשומים</div>
                        <div className="text-2xl font-bold text-text mt-1">{members.length}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs">
                        <div className="text-xs text-text-muted">סה&quot;כ תרומות (נדרים פלוס)</div>
                        <div className="text-2xl font-bold text-success mt-1">₪{totalIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs">
                        <div className="text-xs text-text-muted">הוראות קבע</div>
                        <div className="text-2xl font-bold text-primary mt-1">{recurringCount}</div>
                    </div>
                </div>

                {/* Pending Requests Section */}
                <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-sm font-bold text-text">
                            בקשות הצטרפות ממתינות ({pendingRequests.length})
                        </h2>
                        {isPending && <span className="text-xs text-text-muted">מעדכן נתונים...</span>}
                    </div>

                    {rejectError && (
                        <div className="mx-6 mt-4 px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                            {rejectError}
                        </div>
                    )}

                    {pendingRequests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">
                            אין כרגע בקשות הצטרפות ממתינות
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {pendingRequests.map((req) => (
                                <JoinRequestCard
                                    key={req.id}
                                    request={req}
                                    emailConfigured={emailConfigured}
                                    actions={
                                        pendingApproval?.id === req.id ? (
                                            <div className="w-full md:w-80 p-3 bg-success/10 border border-success/30 rounded-xl space-y-2 shrink-0">
                                                <p className="text-xs font-semibold text-success">
                                                    סיסמה ראשונית שנוצרה - יש למסור אותה לחבר החדש (טלפון/וואטסאפ). הסיסמה לא תוצג שוב.
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 px-2.5 py-1.5 bg-surface border border-success/40 rounded-lg text-sm font-mono text-success select-all">
                                                        {pendingApproval.password}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(pendingApproval.password)}
                                                        className="px-2.5 py-1.5 bg-surface hover:bg-success/20 border border-success/40 text-success text-xs font-semibold rounded-lg transition-colors"
                                                    >
                                                        העתק
                                                    </button>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-success mb-1">
                                                        שיוך למשפחה
                                                    </label>
                                                    <select
                                                        value={pendingApproval.familyId}
                                                        onChange={(e) =>
                                                            setPendingApproval({ ...pendingApproval, familyId: e.target.value })
                                                        }
                                                        className="w-full px-2.5 py-1.5 bg-surface border border-success/40 rounded-lg text-xs"
                                                    >
                                                        <option value="">משפחה חדשה</option>
                                                        {families.map((f) => (
                                                            <option key={f.id} value={f.id}>
                                                                שייך למשפחת {f.headLastName} ({f.headFirstName})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {approveError && (
                                                    <p className="text-xs font-medium text-danger bg-danger-bg border border-danger-border rounded-lg px-2.5 py-1.5">
                                                        {approveError}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleConfirmApprove(req.id, pendingApproval.password, pendingApproval.familyId)
                                                        }
                                                        disabled={processingId === req.id}
                                                        className="flex-1 px-3 py-2 bg-primary hover:bg-primary-hover disabled:bg-border text-white text-xs font-semibold rounded-xl transition-colors"
                                                    >
                                                        {processingId === req.id ? "מאשר..." : "אשר ושמור"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelApprove}
                                                        disabled={processingId === req.id}
                                                        className="px-3 py-2 text-text-muted hover:bg-background text-xs font-semibold rounded-xl transition-colors"
                                                    >
                                                        ביטול
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleStartApprove(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-border text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                                                >
                                                    אשר חבר קהילה
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="px-3 py-2 bg-danger-bg hover:opacity-80 disabled:opacity-50 text-danger text-xs font-semibold rounded-xl border border-danger-border transition-colors"
                                                >
                                                    דחה
                                                </button>
                                            </div>
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Existing Members Section */}
                <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-sm font-bold text-text">
                            חברי קהילה במערכת ({members.length})
                        </h2>
                    </div>

                    {memberActionError && (
                        <div className="mx-6 mt-4 px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                            {memberActionError}
                        </div>
                    )}

                    {resetPasswordError && (
                        <div className="mx-6 mt-4 px-3.5 py-2.5 bg-danger-bg border border-danger-border rounded-xl text-xs font-medium text-danger">
                            {resetPasswordError}
                        </div>
                    )}

                    {resetPasswordResult && (
                        <div className="mx-6 mt-4 p-3 bg-success/10 border border-success/30 rounded-xl space-y-2">
                            <p className="text-xs font-semibold text-success">
                                סיסמה חדשה נוצרה עבור {resetPasswordResult.name} - יש למסור אותה באופן אישי
                                (טלפון/וואטסאפ). בכניסה הבאה הוא/היא יתבקשו לקבוע סיסמה קבועה. הסיסמה לא תוצג שוב.
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-2.5 py-1.5 bg-surface border border-success/40 rounded-lg text-sm font-mono text-success select-all">
                                    {resetPasswordResult.password}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(resetPasswordResult.password)}
                                    className="px-2.5 py-1.5 bg-surface hover:bg-success/20 border border-success/40 text-success text-xs font-semibold rounded-lg transition-colors"
                                >
                                    העתק
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResetPasswordResult(null)}
                                    className="px-2.5 py-1.5 text-xs text-text-muted hover:bg-background rounded-lg transition-colors"
                                >
                                    סגור
                                </button>
                            </div>
                        </div>
                    )}

                    {members.length === 0 ? (
                        <div className="p-8 text-center text-sm text-text-muted">
                            עדיין לא אושרו חברים. אשר את הבקשה הראשונה למעלה!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-background text-text-muted font-medium">
                                    <tr>
                                        <th className="px-6 py-3">שם מלא</th>
                                        <th className="px-6 py-3">טלפון</th>
                                        <th className="px-6 py-3">מייל</th>
                                        <th className="px-6 py-3">מעמד הלכתי</th>
                                        <th className="px-6 py-3">תפקיד</th>
                                        <th className="px-6 py-3">סטטוס</th>
                                        <th className="px-6 py-3">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-text">
                                    {members.map((m) => (
                                        <tr key={m.id} className="hover:bg-background/50">
                                            <td className="px-6 py-3 font-semibold text-text">
                                                {m.firstName} {m.lastName}
                                            </td>
                                            <td className="px-6 py-3">{m.phone}</td>
                                            <td className="px-6 py-3">{m.email ?? "—"}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-0.5 rounded-md bg-background text-text">
                                                    {m.halachicStatus === "kohen"
                                                        ? "כהן"
                                                        : m.halachicStatus === "levi"
                                                            ? "לוי"
                                                            : "ישראל"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {viewerRole === "super_admin" ? (
                                                    <select
                                                        value={m.role}
                                                        disabled={isPending}
                                                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                                                        className="px-2 py-1 bg-surface border border-border rounded-lg text-xs disabled:bg-background"
                                                    >
                                                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                                            <option key={value} value={value}>{label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-md bg-background text-text">
                                                        {ROLE_LABELS[m.role] ?? m.role}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md ${m.isApproved ? "bg-success/10 text-success" : "bg-background text-text-muted"
                                                        }`}
                                                >
                                                    {m.isApproved ? "פעיל" : "לא פעיל"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    {m.email && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResetPassword(m.id, `${m.firstName} ${m.lastName}`)}
                                                            disabled={isPending}
                                                            className="px-3 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 bg-primary/10 hover:bg-primary/20 text-primary"
                                                        >
                                                            {processingId === m.id ? "מאפס..." : "איפוס סיסמה"}
                                                        </button>
                                                    )}
                                                    {m.id !== viewerId && (m.role !== "super_admin" || viewerRole === "super_admin") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleApproval(m.id, m.isApproved)}
                                                            disabled={isPending}
                                                            className={`px-3 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 ${m.isApproved
                                                                ? "bg-danger-bg hover:opacity-80 text-danger"
                                                                : "bg-success/10 hover:bg-success/20 text-success"
                                                                }`}
                                                        >
                                                            {m.isApproved ? "השבתה" : "הפעלה"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Donations Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-sm font-bold text-text">התפלגות תרומות לפי יעד</h2>
                        </div>
                        {fundBreakdown.length === 0 ? (
                            <div className="p-6 text-center text-xs text-text-muted">אין עדיין תרומות רשומות</div>
                        ) : (
                            <div className="divide-y divide-border">
                                {fundBreakdown.map((f) => (
                                    <div key={f.targetFund} className="px-6 py-3 flex items-center justify-between text-xs">
                                        <span className="text-text">{f.targetFund}</span>
                                        <span className="font-bold text-text">₪{f.total.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-border">
                            <h2 className="text-sm font-bold text-text">תרומות אחרונות</h2>
                        </div>
                        {transactions.length === 0 ? (
                            <div className="p-6 text-center text-xs text-text-muted">אין עדיין תרומות רשומות</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-background text-text-muted font-medium">
                                        <tr>
                                            <th className="px-6 py-3">תורם</th>
                                            <th className="px-6 py-3">סכום</th>
                                            <th className="px-6 py-3">יעד</th>
                                            <th className="px-6 py-3">סוג</th>
                                            <th className="px-6 py-3">תאריך</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-text">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-background/50">
                                                <td className="px-6 py-3 font-semibold text-text">{tx.clientName}</td>
                                                <td className="px-6 py-3">₪{tx.amount.toLocaleString()}</td>
                                                <td className="px-6 py-3">{tx.targetFund}</td>
                                                <td className="px-6 py-3">
                                                    {tx.isRecurring ? (
                                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary">הוראת קבע</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md bg-background text-text-muted">חד פעמי</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-text-muted">
                                                    {new Date(tx.createdAt).toLocaleDateString("he-IL")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
