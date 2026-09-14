import type { HTMLAttributes } from "react";

export type AlertVariant = "success" | "error" | "info";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
    success: "bg-success/10 border-success/30 text-success",
    error: "bg-danger-bg border-danger-border text-danger",
    info: "bg-primary/10 border-primary/20 text-primary",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
}

export default function Alert({ variant = "info", className = "", children, ...props }: AlertProps) {
    return (
        <div
            className={`px-3.5 py-2.5 border rounded-xl text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
