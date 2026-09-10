"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { approveJoinRequest, rejectJoinRequest } from "@/app/actions/admin";
import { logout } from "@/app/actions/auth";

interface PendingRequest {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    about: string | null;
    createdAt: Date;
}

interface MemberRecord {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    halachicStatus: string;
}

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
    transactions: TransactionRecord[];
    totalIncome: number;
    fundBreakdown: FundBreakdownEntry[];
    recurringCount: number;
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
    transactions,
    totalIncome,
    fundBreakdown,
    recurringCount,
}: AdminDashboardClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [pendingApproval, setPendingApproval] = useState<{ id: string; password: string } | null>(null);
    const [approveError, setApproveError] = useState<string | null>(null);
    const [rejectError, setRejectError] = useState<string | null>(null);

    const handleStartApprove = (id: string) => {
        setApproveError(null);
        setPendingApproval({ id, password: generateInitialPassword() });
    };

    const handleCancelApprove = () => {
        setApproveError(null);
        setPendingApproval(null);
    };

    const handleConfirmApprove = (id: string, password: string) => {
        setProcessingId(id);
        setApproveError(null);
        startTransition(async () => {
            const result = await approveJoinRequest(id, password);
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
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                                מורשה גבאי
                            </span>
                            <h1 className="text-xl font-bold text-slate-900">לוח ניהול קהילתי</h1>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            אישור מצטרפים חדשים, מעקב גבייה וסנכרון תרומות
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/directory"
                            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            ספר הקהילה
                        </Link>
                        <Link
                            href="/"
                            className="px-3.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                        >
                            חזרה לדף הבית
                        </Link>
                        <button
                            type="button"
                            onClick={() => startTransition(() => logout())}
                            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            התנתקות
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">בקשות ממתינות לאישור</div>
                        <div className="text-2xl font-bold text-amber-600 mt-1">{pendingRequests.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">חברי קהילה רשומים</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{members.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">סה&quot;כ תרומות (נדרים פלוס)</div>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">₪{totalIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">הוראות קבע</div>
                        <div className="text-2xl font-bold text-sky-600 mt-1">{recurringCount}</div>
                    </div>
                </div>

                {/* Pending Requests Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">
                            בקשות הצטרפות ממתינות ({pendingRequests.length})
                        </h2>
                        {isPending && <span className="text-xs text-slate-400">מעדכן נתונים...</span>}
                    </div>

                    {rejectError && (
                        <div className="mx-6 mt-4 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                            {rejectError}
                        </div>
                    )}

                    {pendingRequests.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                            אין כרגע בקשות הצטרפות ממתינות
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {pendingRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 text-sm">
                                                {req.firstName} {req.lastName}
                                            </span>
                                            <span className="text-xs text-slate-400">({req.address}, {req.city})</span>
                                        </div>
                                        <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                                            <span>טלפון: {req.phone}</span>
                                            <span>מייל: {req.email}</span>
                                        </div>
                                        {req.about && (
                                            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                                                &quot;{req.about}&quot;
                                            </p>
                                        )}
                                    </div>

                                    {pendingApproval?.id === req.id ? (
                                        <div className="w-full md:w-80 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                                            <p className="text-xs font-semibold text-emerald-900">
                                                סיסמה ראשונית שנוצרה - יש למסור אותה לחבר החדש (טלפון/וואטסאפ). הסיסמה לא תוצג שוב.
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-mono text-emerald-900 select-all">
                                                    {pendingApproval.password}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={() => navigator.clipboard.writeText(pendingApproval.password)}
                                                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg transition-colors"
                                                >
                                                    העתק
                                                </button>
                                            </div>
                                            {approveError && (
                                                <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                                                    {approveError}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleConfirmApprove(req.id, pendingApproval.password)}
                                                    disabled={processingId === req.id}
                                                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl transition-colors"
                                                >
                                                    {processingId === req.id ? "מאשר..." : "אשר ושמור"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelApprove}
                                                    disabled={processingId === req.id}
                                                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors"
                                                >
                                                    ביטול
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleStartApprove(req.id)}
                                                disabled={processingId === req.id}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                                            >
                                                אשר חבר קהילה
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                disabled={processingId === req.id}
                                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
                                            >
                                                דחה
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Existing Members Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">
                            חברי קהילה מאושרים במערכת ({members.length})
                        </h2>
                    </div>

                    {members.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                            עדיין לא אושרו חברים. אשר את הבקשה הראשונה למעלה!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">שם מלא</th>
                                        <th className="px-6 py-3">טלפון</th>
                                        <th className="px-6 py-3">מייל</th>
                                        <th className="px-6 py-3">מעמד הלכתי</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {members.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-semibold text-slate-900">
                                                {m.firstName} {m.lastName}
                                            </td>
                                            <td className="px-6 py-3">{m.phone}</td>
                                            <td className="px-6 py-3">{m.email}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                    {m.halachicStatus === "kohen"
                                                        ? "כהן"
                                                        : m.halachicStatus === "levi"
                                                            ? "לוי"
                                                            : "ישראל"}
                                                </span>
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
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">התפלגות תרומות לפי יעד</h2>
                        </div>
                        {fundBreakdown.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">אין עדיין תרומות רשומות</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {fundBreakdown.map((f) => (
                                    <div key={f.targetFund} className="px-6 py-3 flex items-center justify-between text-xs">
                                        <span className="text-slate-700">{f.targetFund}</span>
                                        <span className="font-bold text-slate-900">₪{f.total.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">תרומות אחרונות</h2>
                        </div>
                        {transactions.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">אין עדיין תרומות רשומות</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">תורם</th>
                                            <th className="px-6 py-3">סכום</th>
                                            <th className="px-6 py-3">יעד</th>
                                            <th className="px-6 py-3">סוג</th>
                                            <th className="px-6 py-3">תאריך</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-semibold text-slate-900">{tx.clientName}</td>
                                                <td className="px-6 py-3">₪{tx.amount.toLocaleString()}</td>
                                                <td className="px-6 py-3">{tx.targetFund}</td>
                                                <td className="px-6 py-3">
                                                    {tx.isRecurring ? (
                                                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">הוראת קבע</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">חד פעמי</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500">
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
