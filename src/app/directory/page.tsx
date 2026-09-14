import { requireSessionOrRedirect } from "@/lib/auth";
import { getDirectoryMembers } from "@/app/actions/directory";
import DirectoryClient from "./DirectoryClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
    await requireSessionOrRedirect();

    const members = await getDirectoryMembers();

    return <DirectoryClient members={members} />;
}
