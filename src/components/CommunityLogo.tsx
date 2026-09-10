"use client";

import { useState } from "react";
import Image from "next/image";
import { LOGO_INITIAL, LOGO_PATH, COMMUNITY_NAME } from "@/lib/branding";

interface CommunityLogoProps {
    size?: "sm" | "md";
    className?: string;
}

const SIZE_CONFIG: Record<NonNullable<CommunityLogoProps["size"]>, { classes: string; px: number }> = {
    sm: { classes: "w-10 h-10 rounded-xl text-lg", px: 40 },
    md: { classes: "w-12 h-12 rounded-2xl text-xl", px: 48 },
};

// Renders the real logo once one is dropped at public/logo.png; falls back
// to a letter badge (today's placeholder style) until then.
export default function CommunityLogo({ size = "sm", className = "" }: CommunityLogoProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const { classes, px } = SIZE_CONFIG[size];

    const baseClasses = `${classes} flex items-center justify-center shadow-sm ${className}`;

    if (imageFailed) {
        return (
            <div className={`${baseClasses} bg-amber-600 text-white font-bold`}>
                {LOGO_INITIAL}
            </div>
        );
    }

    return (
        <Image
            src={LOGO_PATH}
            alt={COMMUNITY_NAME}
            width={px}
            height={px}
            onError={() => setImageFailed(true)}
            className={`${baseClasses} object-cover bg-amber-600`}
        />
    );
}
