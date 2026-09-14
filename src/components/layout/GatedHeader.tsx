import Link from "next/link";
import { Gift, Users, UserRound, ShieldCheck, LogOut } from "lucide-react";
import { COMMUNITY_NAME, COMMUNITY_TAGLINE } from "@/lib/branding";
import { ADMIN_ROLES } from "@/lib/session";
import { requireSession, requireSessionOrRedirect } from "@/lib/auth";
import CommunityLogo from "@/components/CommunityLogo";
import { LinkButton } from "@/components/ui/Button";
import { logout } from "@/app/actions/auth";

interface GatedHeaderProps {
    // Pages that must stay reachable by anonymous visitors (donate,
    // join-request) can still show the full nav to an already-logged-in
    // visitor by passing `optional` - a session that fails validation then
    // renders nothing instead of redirecting to /login, so a genuinely
    // anonymous (or de-approved) visitor never gets bounced off a page that
    // has to stay public. Default (unset) behavior is unchanged.
    optional?: boolean;
}

// Shared sticky, full-width top nav for every members-only page (homepage,
// directory, profile, admin area). Uses requireSessionOrRedirect() (not
// requireSession()) so a session that somehow fails this check redirects to
// /login like every other guard in the app, instead of throwing an uncaught
// error - even though the page itself already guards access, this must fail
// the same graceful way, not crash. Where the page's own guard also calls
// requireSession()/requireSessionOrRedirect(), the DB check is deduped via
// React's cache() and costs no extra round-trip.
export default async function GatedHeader({ optional = false }: GatedHeaderProps) {
    let session;
    if (optional) {
        try {
            session = await requireSession();
        } catch {
            return null;
        }
    } else {
        session = await requireSessionOrRedirect();
    }
    const isAdmin = ADMIN_ROLES.has(session.role);

    return (
        <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-xs">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <CommunityLogo size="sm" />
                    <div className="min-w-0">
                        <span className="font-bold text-base sm:text-lg text-text tracking-tight block leading-tight">
                            {COMMUNITY_NAME}
                        </span>
                        <span className="text-xs text-text-muted">{COMMUNITY_TAGLINE}</span>
                    </div>
                </Link>

                <nav className="flex flex-wrap items-center gap-2">
                    <LinkButton href="/donate" variant="accent" size="sm">
                        <Gift className="size-4" aria-hidden="true" />
                        <span>תרומה</span>
                    </LinkButton>
                    <LinkButton href="/directory" variant="ghost" size="sm">
                        <Users className="size-4" aria-hidden="true" />
                        <span>אלפון קהילתי</span>
                    </LinkButton>
                    <LinkButton href="/profile" variant="ghost" size="sm">
                        <UserRound className="size-4" aria-hidden="true" />
                        <span>האזור האישי</span>
                    </LinkButton>
                    {isAdmin && (
                        <LinkButton href="/admin" variant="ghost" size="sm">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                            <span>אזור ניהול</span>
                        </LinkButton>
                    )}
                    <form action={logout}>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-background rounded-xl transition-colors"
                        >
                            <LogOut className="size-4" aria-hidden="true" />
                            <span>התנתקות</span>
                        </button>
                    </form>
                </nav>
            </div>
        </header>
    );
}
