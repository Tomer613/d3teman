"use client";

import { useState } from "react";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { copyToClipboard } from "@/lib/clipboard";
import Badge from "@/components/ui/Badge";

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
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between hover:border-accent/50 transition-colors">
            <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="accent">{EVENT_TYPE_LABELS[type] ?? type}</Badge>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs font-medium text-text-muted">{eventDateLabel}</span>
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-4">{description}</p>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted gap-2">
                <span className="min-w-0 truncate">{location ? `מיקום: ${location}` : ""}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg transition-colors"
                >
                    {copied ? "הועתק!" : "שיתוף בוואטסאפ"}
                </button>
            </div>
        </div>
    );
}
