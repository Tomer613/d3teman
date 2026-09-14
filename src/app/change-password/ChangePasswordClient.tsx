"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/app/actions/auth";
import { COMMUNITY_NAME, COMMUNITY_TAGLINE } from "@/lib/branding";
import CommunityLogo from "@/components/CommunityLogo";
import DecorativePattern from "@/components/ui/DecorativePattern";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface ChangePasswordClientProps {
    // True when the account still carries a temporary/reset password and
    // this page was reached via the proxy's forced redirect (no way back
    // to /profile or /admin until a new password is set).
    forced: boolean;
}

export default function ChangePasswordClient({ forced }: ChangePasswordClientProps) {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("הסיסמאות אינן תואמות");
            return;
        }

        setIsSubmitting(true);
        const result = await changePassword(newPassword);

        if (!result.success) {
            setError(result.error);
            setIsSubmitting(false);
            return;
        }

        router.push(result.role === "member" ? "/profile" : "/admin");
        router.refresh();
    };

    return (
        <div className="relative min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <DecorativePattern variant="grid" className="absolute inset-0" />

            <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
                <CommunityLogo size="md" className="mx-auto mb-4" />
                <h1 className="text-lg font-bold tracking-tight text-text">{COMMUNITY_NAME}</h1>
                <p className="mt-1 text-sm text-text-muted">{COMMUNITY_TAGLINE}</p>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-text">קביעת סיסמה חדשה</h2>
                <p className="mt-2 text-sm text-text-muted">
                    {forced
                        ? "מטעמי אבטחה יש להחליף את הסיסמה הזמנית שקיבלת לפני המשך השימוש במערכת"
                        : "בחר/י סיסמה חדשה לחשבונך"}
                </p>
            </div>

            <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card padding="lg">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && <Alert variant="error">{error}</Alert>}

                        <Input
                            label="סיסמה חדשה"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="לפחות 8 תווים"
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((show) => !show)}
                                    tabIndex={-1}
                                    className="text-text-muted hover:text-text"
                                    aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" aria-hidden="true" />
                                    ) : (
                                        <Eye className="size-4" aria-hidden="true" />
                                    )}
                                </button>
                            }
                        />

                        <Input
                            label="אימות סיסמה חדשה"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="הקלד/י שוב את הסיסמה החדשה"
                        />

                        <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} loadingLabel="שומר...">
                            שמירת סיסמה חדשה
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
