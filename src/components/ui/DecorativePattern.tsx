type DecorativePatternVariant = "grid" | "arabesque-border";

interface DecorativePatternProps {
    variant?: DecorativePatternVariant;
    className?: string;
}

// Purely decorative, symmetric geometric motifs - no directionality, so no
// RTL mirroring is needed. Always aria-hidden + pointer-events-none, and
// kept at low opacity so it never competes with foreground text contrast.
export default function DecorativePattern({ variant = "grid", className = "" }: DecorativePatternProps) {
    const patternId = variant === "grid" ? "decorative-pattern-grid" : "decorative-pattern-arabesque";

    return (
        <svg
            aria-hidden="true"
            className={`pointer-events-none ${className}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
        >
            <defs>
                {variant === "grid" ? (
                    <pattern id={patternId} width="64" height="64" patternUnits="userSpaceOnUse">
                        <path
                            d="M32 4 L40 24 L60 32 L40 40 L32 60 L24 40 L4 32 L24 24 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-primary"
                            opacity="0.06"
                        />
                    </pattern>
                ) : (
                    <pattern id={patternId} width="48" height="24" patternUnits="userSpaceOnUse">
                        <path
                            d="M0 24 Q12 0 24 24 Q36 0 48 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-accent"
                            opacity="0.16"
                        />
                    </pattern>
                )}
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
    );
}
