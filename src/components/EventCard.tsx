"use client";

import { useState } from "react";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { copyToClipboard } from "@/lib/clipboard";

const EVENT_TYPE_LABELS: Record<string, string> = {
    brit_yitzchak: "ברית יצחק",
    shabbat_chatan: "שבת חתן",
    bar_mitzvah: "בר מצווה",
    wedding: "חתונה",
    general: "כללי",
};

interface EventCardProps {
    title: string;
    type: string;
    description: string;
    eventDateLabel: string;
    location: string | null;
}

export default function EventCard({ title, type, description, eventDateLabel, location }: EventCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const body = [location, description].filter(Boolean).join("\n");
        const text = buildWhatsAppMessage(title, [
            { category: EVENT_TYPE_LABELS[type] ?? type, title: eventDateLabel, body },
        ]);
        if (await copyToClipboard(text)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        {EVENT_TYPE_LABELS[type] ?? type}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">{eventDateLabel}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                <span className="min-w-0 truncate">{location ? `מיקום: ${location}` : ""}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg transition-colors"
                >
                    {copied ? "הועתק!" : "שיתוף בוואטסאפ"}
                </button>
            </div>
        </div>
    );
}
