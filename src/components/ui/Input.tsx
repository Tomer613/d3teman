import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    // Small control rendered inside the input's edge (e.g. a show/hide
    // password toggle) - kept generic rather than a dedicated `type="password"`
    // prop so any future adornment can reuse the same slot.
    rightElement?: ReactNode;
}

export default function Input({ label, error, id, className = "", rightElement, ...props }: InputProps) {
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-xs font-medium text-text">
                    {label}
                </label>
            )}
            <div className="relative mt-1">
                <input
                    id={id}
                    className={`block w-full px-3.5 py-2.5 ${rightElement ? "pl-10" : ""} bg-background border rounded-xl text-text text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-surface transition-all ${
                        error ? "border-danger-border" : "border-border"
                    } ${className}`}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">{rightElement}</div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    );
}
