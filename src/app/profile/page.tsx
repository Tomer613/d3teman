import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await getSession();
    if (!session) {
        redirect("/login");
    }

    const member = await prisma.member.findUnique({
        where: { id: session.sub },
        include: { yahrzeits: { orderBy: { createdAt: "asc" } } },
        omit: { passwordHash: true },
    });

    // Re-checks approval against the just-fetched row rather than trusting
    // the JWT for its full lifetime - a de-approved member (or a session for
    // a deleted account) is rejected immediately, not after the token expires.
    if (!member || !member.isApproved) {
        redirect("/login");
    }

    return <ProfileClient member={member} yahrzeits={member.yahrzeits} />;
}
