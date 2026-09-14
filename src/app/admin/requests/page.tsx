import { requireAdminOrRedirect } from "@/lib/auth";
import { getRequestsDashboardData } from "@/app/actions/admin";
import GatedHeader from "@/components/layout/GatedHeader";
import RequestsClient from "./RequestsClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
    await requireAdminOrRedirect();

    const { kiddushRequests, haftarahRequests } = await getRequestsDashboardData();

    return (
        <>
            <GatedHeader />
            <RequestsClient kiddushRequests={kiddushRequests} haftarahRequests={haftarahRequests} />
        </>
    );
}
