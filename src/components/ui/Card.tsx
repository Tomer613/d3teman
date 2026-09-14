import type { HTMLAttributes } from "react";

type CardPadding = "sm" | "md" | "lg";

const PADDING_CLASSES: Record<CardPadding, string> = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6 sm:p-8",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: CardPadding;
}

export default function Card({ padding = "md", className = "", children, ...props }: CardProps) {
    return (
        <div
            className={`bg-surface rounded-2xl border border-border shadow-xs ${PADDING_CLASSES[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
