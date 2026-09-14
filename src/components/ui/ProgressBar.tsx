interface ProgressBarProps {
    percent: number;
    label?: string;
}

export default function ProgressBar({ percent, label }: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, percent));

    return (
        <div>
            {label && (
                <div className="flex items-center justify-between text-xs font-medium text-text-muted mb-1.5">
                    <span>{label}</span>
                    <span className="font-bold text-text">{clamped}%</span>
                </div>
            )}
            <div className="h-2 rounded-full bg-background overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
}
