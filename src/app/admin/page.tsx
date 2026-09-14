import { requireAdminOrRedirect } from "@/lib/auth";
import { getAdminDashboardData } from "@/app/actions/admin";
import GatedHeader from "@/components/layout/GatedHeader";
import AdminDashboardClient from "./AdminDashboardClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    // Redirects on an invalid/expired/no-longer-admin session instead of
    // letting getAdminDashboardData's try/catch swallow it into an empty
    // dashboard. requireAdmin re-checks the role against the database, so a
    // demoted gabay is rejected immediately rather than for up to 30 days.
    const session = await requireAdminOrRedirect();

    const {
        pendingRequests,
        members,
        recentTransactions,
        totalIncome,
        fundBreakdown,
        recurringCount,
        emailConfigured,
        pendingMemberRequestsCount,
    } = await getAdminDashboardData();

    return (
        <>
            <GatedHeader />
            <AdminDashboardClient
                pendingRequests={pendingRequests}
                members={members}
                transactions={recentTransactions}
                totalIncome={totalIncome}
                fundBreakdown={fundBreakdown}
                recurringCount={recurringCount}
                viewerRole={session.role}
                viewerId={session.sub}
                emailConfigured={emailConfigured}
                pendingMemberRequestsCount={pendingMemberRequestsCount}
            />
        </>
    );
}
