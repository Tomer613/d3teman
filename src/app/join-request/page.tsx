"use client";

import { useState } from "react";
import Link from "next/link";
import { submitJoinRequest } from "@/app/actions/join-request";

export default function JoinRequestPage() {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        about: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const response = await submitJoinRequest(formData);

        setIsSubmitting(false);
        if (response.success) {
            setSubmitted(true);
        } else {
            setErrorMessage("אירעה שגיאה בשמירת הפרטים. אנא נסה שנית מאוחר יותר.");
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">הבקשה נשלחה לגבאים בהצלחה!</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        פרטיכם נשמרו במערכת והועברו לבדיקת הגבאים. לאחר האישור יישלח לכתובת המייל קישור להגדרת סיסמה.
                    </p>
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

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block text-xs font-semibold text-amber-700 hover:text-amber-800 mb-2">
                        ← חזרה לדף הבית
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">בקשת הצטרפות לקהילה</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        ההרשמה מיועדת לתושבי השכונה לצורך עדכונים, חיובים ופעילות קהילתית
                    </p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                    {errorMessage && (
                        <div className="p-3 mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                            {errorMessage}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">שם פרטי</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">שם משפחה</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">כתובת מייל</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">מספר טלפון נייד</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">כתובת מגורים (רחוב ומספר)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                    placeholder="רחוב שבזי 10"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">עיר</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                    placeholder="בני ברק"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700">כמה מילים על המשפחה / קשר לקהילה</label>
                            <textarea
                                rows={3}
                                value={formData.about}
                                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:bg-white"
                                placeholder="מתי עברתם לשכונה, מספר ילדים וכו'..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
                            >
                                {isSubmitting ? "שולח בקשה..." : "שליחת בקשה לגבאים"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}