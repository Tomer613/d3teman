import Link from "next/link";
import { Home } from "lucide-react";
import { COMMUNITY_NAME } from "@/lib/branding";
import Card from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

function getDonateUrl(): string | null {
    const url = process.env.NEDARIM_DONATE_URL;
    if (!url || url.includes("PLACEHOLDER")) {
        return null;
    }
    return url;
}

export default function DonatePage() {
    const donateUrl = getDonateUrl();

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <LinkButton href="/login" variant="secondary" size="sm" className="mb-3">
                        <Home className="size-4" aria-hidden="true" />
                        <span>חזרה למסך הכניסה</span>
                    </LinkButton>
                    <h1 className="text-2xl font-bold text-text">תרומה ל{COMMUNITY_NAME}</h1>
                    <p className="text-sm text-text-muted mt-1">
                        כל תרומה, גדולה כקטנה, תומכת בפעילות בית הכנסת ובקהילה
                    </p>
                </div>

                <Card padding="lg" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 bg-accent/10 rounded-xl border border-accent/20">
                            <h2 className="text-sm font-bold text-accent-hover">תרומה חד פעמית</h2>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                תרומה בכל סכום לתמיכה מיידית בפעילות הקהילה
                            </p>
                        </div>
                        <div className="p-5 bg-primary/10 rounded-xl border border-primary/20">
                            <h2 className="text-sm font-bold text-primary">הוראת קבע</h2>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                תרומה חודשית קבועה המאפשרת לקהילה תכנון ויציבות תקציבית
                            </p>
                        </div>
                    </div>

                    {donateUrl ? (
                        <LinkButton
                            href={donateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="accent"
                            size="lg"
                            fullWidth
                        >
                            מעבר לדף התרומה המאובטח (נדרים פלוס)
                        </LinkButton>
                    ) : (
                        <div className="px-4 py-3.5 bg-background border border-border rounded-xl text-center text-xs font-medium text-text-muted">
                            עמוד התרומות בהקמה - יעודכן בקרוב
                        </div>
                    )}

                    <p className="text-xs text-text-muted text-center leading-relaxed">
                        התרומה מתבצעת באמצעות מערכת נדרים פלוס המאובטחת. ניתן לצפות בהיסטוריית התרומות שלך
                        {" "}
                        <Link href="/login" className="text-primary hover:text-primary-hover font-medium">
                            באזור האישי
                        </Link>
                        {" "}
                        (לאחר התחברות).
                    </p>
                </Card>
            </div>
        </div>
    );
}
