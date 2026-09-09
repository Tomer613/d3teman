import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/app/actions/admin";
import AdminDashboardClient from "./AdminDashboardClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    // Redirects on an invalid/expired/no-longer-admin session instead of
    // letting getAdminDashboardData's try/catch swallow it into an empty
    // dashboard. requireAdmin re-checks the role against the database, so a
    // demoted gabay is rejected immediately rather than for up to 30 days.
    try {
        await requireAdmin();
    } catch {
        redirect("/login");
    }

    const { pendingRequests, members, recentTransactions } = await getAdminDashboardData();

    return (
        <AdminDashboardClient
            pendingRequests={pendingRequests}
            members={members}
            transactions={recentTransactions}
        />
    );
}
