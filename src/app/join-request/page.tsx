"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { submitJoinRequest } from "@/app/actions/join-request";
import { COMMUNITY_CITY } from "@/lib/branding";
import DecorativePattern from "@/components/ui/DecorativePattern";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button, { LinkButton } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card padding="lg" className="max-w-md w-full text-center space-y-4">
                    <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                        ✓
                    </div>
                    <h2 className="text-xl font-bold text-text">הבקשה נשלחה לגבאים בהצלחה!</h2>
                    <p className="text-sm text-text-muted leading-relaxed">
                        פרטיכם נשמרו במערכת והועברו לבדיקת הגבאים. לאחר האישור יישלח לכתובת המייל קישור להגדרת סיסמה.
                    </p>
                    <div className="pt-4">
                        <LinkButton href="/" variant="secondary" size="sm">
                            חזרה לדף הבית
                        </LinkButton>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <DecorativePattern variant="grid" className="absolute inset-0" />

            <div className="relative max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <LinkButton href="/login" variant="secondary" size="sm" className="mb-3">
                        <Home className="size-4" aria-hidden="true" />
                        <span>חזרה למסך הכניסה</span>
                    </LinkButton>
                    <h1 className="text-2xl font-bold text-text">בקשת הצטרפות לקהילה</h1>
                    <p className="text-sm text-text-muted mt-1">
                        ההרשמה מיועדת לתושבי השכונה לצורך עדכונים, חיובים ופעילות קהילתית
                    </p>
                </div>

                <Card padding="lg">
                    {errorMessage && <Alert variant="error" className="mb-4">{errorMessage}</Alert>}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="שם פרטי"
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <Input
                                label="שם משפחה"
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="כתובת מייל"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Input
                                label="מספר טלפון נייד"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="כתובת מגורים (רחוב ומספר)"
                                type="text"
                                required
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="לדוגמה: רחוב הראשי 10"
                            />
                            <Input
                                label="עיר"
                                type="text"
                                required
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder={COMMUNITY_CITY}
                            />
                        </div>

                        <Textarea
                            label="כמה מילים על המשפחה / קשר לקהילה"
                            rows={3}
                            value={formData.about}
                            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                            placeholder="מתי עברתם לשכונה, מספר ילדים וכו'..."
                        />

                        <div className="pt-2">
                            <Button type="submit" variant="accent" fullWidth isLoading={isSubmitting} loadingLabel="שולח בקשה...">
                                שליחת בקשה לגבאים
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
