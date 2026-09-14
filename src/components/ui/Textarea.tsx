import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export default function Textarea({ label, error, id, className = "", ...props }: TextareaProps) {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-xs font-medium text-text">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                className={`mt-1 block w-full px-3.5 py-2.5 bg-background border rounded-xl text-text text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface transition-all ${
                    error ? "border-danger-border" : "border-border"
                } ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    );
}
