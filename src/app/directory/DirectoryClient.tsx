"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { HalachicStatus } from "@/types";
import { DirectoryMember } from "@/app/actions/directory";

interface DirectoryClientProps {
    members: DirectoryMember[];
}

export default function DirectoryClient({ members }: DirectoryClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Filter members based on search and status
    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const fullName = `${member.firstName} ${member.lastName}`;
            const matchesSearch =
                fullName.includes(searchQuery) ||
                (member.street?.includes(searchQuery) ?? false) ||
                (member.phone?.includes(searchQuery) ?? false);

            const matchesStatus =
                statusFilter === "all" || member.halachicStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [members, searchQuery, statusFilter]);

    // Clean raw phone number for WhatsApp URL
    const formatWhatsappNumber = (phone: string) => {
        const digitsOnly = phone.replace(/\D/g, "");
        return digitsOnly.startsWith("0") ? `972${digitsOnly.slice(1)}` : digitsOnly;
    };

    const getStatusBadge = (status: HalachicStatus | string) => {
        switch (status) {
            case "kohen":
                return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-800">כהן</span>;
            case "levi":
                return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-sky-100 text-sky-800">לוי</span>;
            default:
                return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">ישראל</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link href="/" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
                            ← חזרה לדף הבית
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">אלפון הקהילה</h1>
                        <p className="text-sm text-slate-500">
                            איתור חברי הקהילה ויצירת קשר מהיר
                        </p>
                    </div>

                    <div className="text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
                        סה&quot;כ חברים מוצגים: <span className="font-bold text-slate-900">{filteredMembers.length}</span>
                    </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            placeholder="חיפוש לפי שם, רחוב או מספר טלפון..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                        >
                            <option value="all">כל המעמדות</option>
                            <option value="kohen">כהן</option>
                            <option value="levi">לוי</option>
                            <option value="yisrael">ישראל</option>
                        </select>
                    </div>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-colors"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">
                                            {member.firstName} {member.lastName}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {member.street
                                                ? `${member.street}, ${member.city}`
                                                : "כתובת שמורה במערכת"}
                                        </p>
                                    </div>
                                    {getStatusBadge(member.halachicStatus)}
                                </div>

                                <div className="text-xs text-slate-600 space-y-1 mb-4">
                                    {member.phone ? (
                                        <p className="font-mono text-slate-700 font-medium">{member.phone}</p>
                                    ) : (
                                        <p className="text-slate-400 italic">מספר טלפון חסוי</p>
                                    )}
                                    <p className="truncate text-slate-500">{member.email}</p>
                                </div>
                            </div>

                            {/* Quick Communication Actions */}
                            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                {member.phone && (
                                    <>
                                        <a
                                            href={`tel:${member.phone}`}
                                            className="flex-1 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg text-center transition-colors"
                                        >
                                            חיוג
                                        </a>
                                        <a
                                            href={`https://wa.me/${formatWhatsappNumber(member.phone)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg text-center transition-colors"
                                        >
                                            WhatsApp
                                        </a>
                                    </>
                                )}
                                <a
                                    href={`mailto:${member.email}`}
                                    className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                                    title="שליחת מייל"
                                >
                                    מייל
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
                        <p className="text-sm text-slate-500">לא נמצאו חברים התואמים את החיפוש.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
