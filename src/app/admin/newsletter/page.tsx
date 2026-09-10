import { requireAdminOrRedirect } from "@/lib/auth";
import { getNewsletterDashboardData } from "@/app/actions/newsletter";
import NewsletterClient from "./NewsletterClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function NewsletterBuilderPage() {
    await requireAdminOrRedirect();

    const data = await getNewsletterDashboardData();

    return (
        <NewsletterClient
            recipientCount={data.recipientCount}
            emailConfigured={data.emailConfigured}
            newsletters={data.newsletters}
        />
    );
}
