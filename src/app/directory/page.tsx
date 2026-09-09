import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getDirectoryMembers } from "@/app/actions/directory";
import DirectoryClient from "./DirectoryClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
    try {
        await requireSession();
    } catch {
        redirect("/login");
    }

    const members = await getDirectoryMembers();

    return <DirectoryClient members={members} />;
}
