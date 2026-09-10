import Link from "next/link";

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
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-block text-xs font-semibold text-amber-700 hover:text-amber-800 mb-2">
                        ← חזרה לדף הבית
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">תרומה לקהילת תפארת תימן</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        כל תרומה, גדולה כקטנה, תומכת בפעילות בית הכנסת ובקהילה
                    </p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 bg-amber-50/60 rounded-xl border border-amber-200/70">
                            <h2 className="text-sm font-bold text-amber-900">תרומה חד פעמית</h2>
                            <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                                תרומה בכל סכום לתמיכה מיידית בפעילות הקהילה
                            </p>
                        </div>
                        <div className="p-5 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
                            <h2 className="text-sm font-bold text-emerald-900">הוראת קבע</h2>
                            <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                                תרומה חודשית קבועה המאפשרת לקהילה תכנון ויציבות תקציבית
                            </p>
                        </div>
                    </div>

                    {donateUrl ? (
                        <a
                            href={donateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
                        >
                            מעבר לדף התרומה המאובטח (נדרים פלוס)
                        </a>
                    ) : (
                        <div className="px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-medium text-slate-500">
                            עמוד התרומות בהקמה - יעודכן בקרוב
                        </div>
                    )}

                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                        התרומה מתבצעת באמצעות מערכת נדרים פלוס המאובטחת. ניתן לצפות בהיסטוריית התרומות שלך
                        {" "}
                        <Link href="/profile" className="text-amber-700 hover:text-amber-800 font-medium">
                            באזור האישי
                        </Link>
                        {" "}
                        (לאחר התחברות).
                    </p>
                </div>
            </div>
        </div>
    );
}
