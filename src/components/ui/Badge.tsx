import type { HTMLAttributes } from "react";

export type BadgeVariant = "neutral" | "primary" | "accent" | "success" | "danger";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    neutral: "bg-background text-text-muted",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent-hover",
    success: "bg-success/10 text-success",
    danger: "bg-danger-bg text-danger",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export default function Badge({ variant = "neutral", className = "", children, ...props }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${VARIANT_CLASSES[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}
