import { COMMUNITY_NAME, COMMUNITY_TAGLINE } from "@/lib/branding";
import CommunityLogo from "@/components/CommunityLogo";
import { LinkButton } from "@/components/ui/Button";
import { logout } from "@/app/actions/auth";

// Shared header for members-only pages (homepage, directory, profile).
// Unlike the old public homepage header, this always includes a logout
// link - a logged-in member needs a way out of the gated area.
export default function GatedHeader() {
    return (
        <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-xs">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <CommunityLogo size="sm" />
                    <div className="min-w-0">
                        <span className="font-bold text-base sm:text-lg text-text tracking-tight block leading-tight">
                            {COMMUNITY_NAME}
                        </span>
                        <span className="text-xs text-text-muted">{COMMUNITY_TAGLINE}</span>
                    </div>
                </div>

                <nav className="flex flex-wrap items-center gap-2">
                    <LinkButton href="/donate" variant="accent" size="sm">
                        תרומה
                    </LinkButton>
                    <LinkButton href="/directory" variant="ghost" size="sm">
                        אלפון קהילתי
                    </LinkButton>
                    <LinkButton href="/profile" variant="ghost" size="sm">
                        האזור האישי
                    </LinkButton>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="px-3.5 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-background rounded-lg transition-colors"
                        >
                            התנתקות
                        </button>
                    </form>
                </nav>
            </div>
        </header>
    );
}
