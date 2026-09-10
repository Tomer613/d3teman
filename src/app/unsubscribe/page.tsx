import Link from "next/link";
import { unsubscribeFromNewsletter } from "@/app/actions/unsubscribe";

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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
                {result.success ? (
                    <>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            ✓
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">הוסרת מרשימת התפוצה</h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            לא תקבל/י יותר עדכוני ניוזלטר במייל. ניתן לשנות זאת בכל עת מהאזור האישי.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                            ✕
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">הקישור אינו תקין</h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            ניתן לעדכן את הגדרות קבלת הניוזלטר מהאזור האישי לאחר התחברות.
                        </p>
                    </>
                )}
                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-block px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        חזרה לדף הבית
                    </Link>
                </div>
            </div>
        </div>
    );
}
