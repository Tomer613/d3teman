import { getAdminDashboardData } from "@/app/actions/admin";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
    const { pendingRequests, members, recentTransactions } = await getAdminDashboardData();

    return (
        <AdminDashboardClient
            pendingRequests={pendingRequests}
            members={members}
            transactions={recentTransactions}
        />
    );
}
