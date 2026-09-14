import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    accent: "bg-accent text-white hover:bg-accent-hover",
    secondary: "bg-surface text-text border border-border hover:bg-background",
    ghost: "text-primary hover:bg-primary/10",
    danger: "bg-danger text-white hover:bg-danger/90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
};

const BASE_CLASSES =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:pointer-events-none";

function buttonClasses(variant: ButtonVariant, size: ButtonSize, fullWidth: boolean, className: string) {
    return [
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    isLoading?: boolean;
    loadingLabel?: ReactNode;
}

export default function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    isLoading = false,
    loadingLabel,
    className = "",
    disabled,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={buttonClasses(variant, size, fullWidth, className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? loadingLabel ?? children : children}
        </button>
    );
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
}

export function LinkButton({
    href,
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    children,
    ...props
}: LinkButtonProps) {
    return (
        <Link href={href} className={buttonClasses(variant, size, fullWidth, className)} {...props}>
            {children}
        </Link>
    );
}
