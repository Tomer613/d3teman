"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HalachicStatus } from "@/types";
import { DirectoryMember } from "@/app/actions/directory";
import { requestFamilyLink } from "@/app/actions/family";
import { toWhatsAppNumber } from "@/lib/phone";
import Badge from "@/components/ui/Badge";

interface DirectoryClientProps {
    members: DirectoryMember[];
}

export default function DirectoryClient({ members }: DirectoryClientProps) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [linkError, setLinkError] = useState<string | null>(null);

    const handleRequestLink = (member: DirectoryMember) => {
        if (!member.familyId) return;
        setSendingId(member.id);
        setLinkError(null);
        startTransition(async () => {
            const result = await requestFamilyLink(member.familyId!);
            if (!result.success) {
                setLinkError(result.error);
                setSendingId(null);
                return;
            }
            router.refresh();
            setSendingId(null);
        });
    };

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

    const getStatusBadge = (status: HalachicStatus | string) => {
        switch (status) {
            case "kohen":
                return <Badge variant="accent">כהן</Badge>;
            case "levi":
                return <Badge variant="primary">לוי</Badge>;
            default:
                return <Badge variant="neutral">ישראל</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text">אלפון הקהילה</h1>
                        <p className="text-sm text-text-muted">
                            איתור חברי הקהילה ויצירת קשר מהיר
                        </p>
                    </div>

                    <div className="text-sm text-text-muted bg-surface px-4 py-2 rounded-xl border border-border shadow-xs self-start sm:self-auto">
                        סה&quot;כ חברים מוצגים: <span className="font-bold text-text">{filteredMembers.length}</span>
                    </div>
                </div>

                {linkError && (
                    <div className="px-4 py-2.5 rounded-xl text-sm font-medium border bg-danger-bg border-danger-border text-danger">
                        {linkError}
                    </div>
                )}

                {/* Search and Filters Bar */}
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            placeholder="חיפוש לפי שם, רחוב או מספר טלפון..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface transition-all"
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface"
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
                            className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between hover:border-accent/40 transition-colors"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-bold text-text">
                                            {member.firstName} {member.lastName}
                                        </h3>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {member.street
                                                ? `${member.street}, ${member.city}`
                                                : "כתובת שמורה במערכת"}
                                        </p>
                                        {member.familyLabel && (
                                            <p className="text-[11px] text-accent-hover font-medium mt-0.5">
                                                {member.familyLabel}
                                            </p>
                                        )}
                                    </div>
                                    {getStatusBadge(member.halachicStatus)}
                                </div>

                                <div className="text-xs text-text-muted space-y-1 mb-4">
                                    {member.phone ? (
                                        <p className="font-mono text-text font-medium">{member.phone}</p>
                                    ) : (
                                        <p className="text-text-muted italic">מספר טלפון חסוי</p>
                                    )}
                                    {member.email && <p className="truncate text-text-muted">{member.email}</p>}
                                </div>
                            </div>

                            {/* Quick Communication Actions */}
                            <div className="pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                                {member.phone && (
                                    <>
                                        <a
                                            href={`tel:${member.phone}`}
                                            className="flex-1 py-1.5 px-3 bg-accent/10 hover:bg-accent/20 text-accent-hover text-xs font-semibold rounded-lg text-center transition-colors"
                                        >
                                            חיוג
                                        </a>
                                        <a
                                            href={`https://wa.me/${toWhatsAppNumber(member.phone)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg text-center transition-colors"
                                        >
                                            WhatsApp
                                        </a>
                                    </>
                                )}
                                {member.email && (
                                    <a
                                        href={`mailto:${member.email}`}
                                        className="py-1.5 px-3 bg-background hover:bg-border text-text text-xs font-semibold rounded-lg transition-colors"
                                        title="שליחת מייל"
                                    >
                                        מייל
                                    </a>
                                )}
                                {!member.isOwnFamily && (
                                    <button
                                        type="button"
                                        onClick={() => handleRequestLink(member)}
                                        disabled={member.linkRequestPending || sendingId === member.id}
                                        className="w-full py-1.5 px-3 bg-accent/10 hover:bg-accent/20 disabled:opacity-60 text-accent-hover text-xs font-semibold rounded-lg text-center transition-colors"
                                    >
                                        {member.linkRequestPending
                                            ? "בקשה ממתינה"
                                            : sendingId === member.id
                                                ? "שולח..."
                                                : "בקש קישור למשפחה"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="text-center py-12 bg-surface rounded-2xl border border-border">
                        <p className="text-sm text-text-muted">לא נמצאו חברים התואמים את החיפוש.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
