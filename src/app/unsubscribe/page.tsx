import { unsubscribeFromNewsletter } from "@/app/actions/unsubscribe";
import Card from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface UnsubscribePageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
    const { token } = await searchParams;
    const result = token
        ? await unsubscribeFromNewsletter(token)
        : { success: false as const, error: "Missing unsubscribe token" };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card padding="lg" className="max-w-md w-full text-center space-y-4">
                {result.success ? (
                    <>
                        <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            ✓
                        </div>
                        <h2 className="text-xl font-bold text-text">הוסרת מרשימת התפוצה</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            לא תקבל/י יותר עדכוני ניוזלטר במייל. ניתן לשנות זאת בכל עת מהאזור האישי.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-danger-bg text-danger rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            ✕
                        </div>
                        <h2 className="text-xl font-bold text-text">הקישור אינו תקין</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            ניתן לעדכן את הגדרות קבלת הניוזלטר מהאזור האישי לאחר התחברות.
                        </p>
                    </>
                )}
                <div className="pt-4">
                    <LinkButton href="/login" variant="secondary" size="sm">
                        חזרה למסך הכניסה
                    </LinkButton>
                </div>
            </Card>
        </div>
    );
}
