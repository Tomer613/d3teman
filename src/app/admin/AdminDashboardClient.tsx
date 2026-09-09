"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { approveJoinRequest, rejectJoinRequest } from "@/app/actions/admin";

interface PendingRequest {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
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
    createdAt: Date;
}

interface AdminDashboardClientProps {
    pendingRequests: PendingRequest[];
    members: MemberRecord[];
    transactions: TransactionRecord[];
}

export default function AdminDashboardClient({
    pendingRequests,
    members,
    transactions,
}: AdminDashboardClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = (id: string) => {
        setProcessingId(id);
        startTransition(async () => {
            await approveJoinRequest(id);
            router.refresh();
            setProcessingId(null);
        });
    };

    const handleReject = (id: string) => {
        setProcessingId(id);
        startTransition(async () => {
            await rejectJoinRequest(id);
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
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">בקשות ממתינות לאישור</div>
                        <div className="text-2xl font-bold text-amber-600 mt-1">{pendingRequests.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">חברי קהילה רשומים</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{members.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="text-xs text-slate-500">עסקאות נדרים פלוס אחרונות</div>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">{transactions.length}</div>
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
                                            <span className="text-xs text-slate-400">({req.address})</span>
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

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleApprove(req.id)}
                                            disabled={processingId === req.id}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                                        >
                                            {processingId === req.id ? "מעבד..." : "אשר חבר קהילה"}
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            disabled={processingId === req.id}
                                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
                                        >
                                            דחה
                                        </button>
                                    </div>
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
            </div>
        </div>
    );
}
