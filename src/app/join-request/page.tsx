import { requireSession } from "@/lib/auth";
import GatedHeader from "@/components/layout/GatedHeader";
import JoinRequestClient from "./JoinRequestClient";

// Always dynamic: reads the session cookie to decide whether to show the
// full nav (logged in) or a plain back-to-login link (anonymous) - this page
// itself must stay reachable either way, since join requests come from
// people who aren't members yet.
export const dynamic = "force-dynamic";

async function isLoggedIn(): Promise<boolean> {
    try {
        await requireSession();
        return true;
    } catch {
        return false;
    }
}

export default async function JoinRequestPage() {
    const loggedIn = await isLoggedIn();

    return (
        <>
            {loggedIn && <GatedHeader optional />}
            <JoinRequestClient showBackToLogin={!loggedIn} />
        </>
    );
}
