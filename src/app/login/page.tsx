"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import { COMMUNITY_NAME, COMMUNITY_TAGLINE } from "@/lib/branding";
import CommunityLogo from "@/components/CommunityLogo";
import DecorativePattern from "@/components/ui/DecorativePattern";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button, { LinkButton } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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
        <div className="relative min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <DecorativePattern variant="grid" className="absolute inset-0" />

            <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
                <CommunityLogo size="md" className="mx-auto mb-4" />
                <h1 className="text-lg font-bold tracking-tight text-text">{COMMUNITY_NAME}</h1>
                <p className="mt-1 text-sm text-text-muted">{COMMUNITY_TAGLINE}</p>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-text">
                    כניסה לפורטל הקהילה
                </h2>
                <p className="mt-2 text-sm text-text-muted">
                    הכניסה באמצעות מייל וסיסמה ראשונית שנמסרו ע&quot;י הגבאים
                </p>
            </div>

            <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card padding="lg">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && <Alert variant="error">{error}</Alert>}

                        <Input
                            label="כתובת מייל"
                            type="email"
                            name="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                        />

                        <Input
                            label="סיסמה"
                            type="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />

                        <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} loadingLabel="מתחבר...">
                            התחברות
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
                        <p className="text-xs text-text-muted">עדיין אין לכם גישה למערכת?</p>
                        <LinkButton href="/join-request" variant="ghost" size="sm">
                            הגשת בקשת הצטרפות לגבאים ←
                        </LinkButton>
                    </div>
                </Card>
            </div>
        </div>
    );
}
