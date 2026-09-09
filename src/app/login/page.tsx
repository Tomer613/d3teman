"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Authentication logic will be wired up with the backend
        console.log("Login attempt:", { email, password });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-sm mb-4">
                    ת
                </div>
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                כתובת מייל
                            </label>
                            <input
                                type="email"
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
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-colors"
                        >
                            התחברות
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