import { requireAdminOrRedirect } from "@/lib/auth";
import { getNewsletterDashboardData } from "@/app/actions/newsletter";
import GatedHeader from "@/components/layout/GatedHeader";
import NewsletterClient from "./NewsletterClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function NewsletterBuilderPage() {
    await requireAdminOrRedirect();

    const data = await getNewsletterDashboardData();

    return (
        <>
            <GatedHeader />
            <NewsletterClient
                recipientCount={data.recipientCount}
                emailConfigured={data.emailConfigured}
                storageConfigured={data.storageConfigured}
                newsletters={data.newsletters}
            />
        </>
    );
}
