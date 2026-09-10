"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import CommunityLogo from "@/components/CommunityLogo";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const result = await login(new FormData(e.currentTarget));

        if (!result.success) {
            setError(result.error);
            setIsSubmitting(false);
            return;
        }

        router.push(result.role === "member" ? "/profile" : "/admin");
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <CommunityLogo size="md" className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    כניסה לפורטל הקהילה
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    הכניסה באמצעות מייל וסיסמה ראשונית שנמסרו ע&quot;י הגבאים
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xs border border-slate-200/80 rounded-2xl sm:px-10">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                כתובת מייל
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                סיסמה
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                        >
                            {isSubmitting ? "מתחבר..." : "התחברות"}
                        </button>
                    </form>

                    {/* Invitation-only redirect */}
                    <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
                        <p className="text-xs text-slate-500">
                            עדיין אין לכם גישה למערכת?
                        </p>
                        <Link
                            href="/join-request"
                            className="inline-block text-sm font-medium text-amber-700 hover:text-amber-800"
                        >
                            הגשת בקשת הצטרפות לגבאים ←
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}