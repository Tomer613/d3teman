import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GatedHeader from "@/components/layout/GatedHeader";
import ProfileClient from "./ProfileClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    // Same guard as every other members-only page, so its DB check is
    // deduped (via requireSession()'s React cache()) with GatedHeader's
    // identical check below, instead of hitting the database twice.
    const session = await requireSessionOrRedirect();

    const member = await prisma.member.findUnique({
        where: { id: session.sub },
        include: { yahrzeits: { orderBy: { createdAt: "asc" } } },
        omit: { passwordHash: true },
    });

    // requireSessionOrRedirect() already confirmed the member exists and is
    // approved; this only guards the narrow race where the account is
    // deleted between that check and this query.
    if (!member) {
        redirect("/login");
    }

    // Capped so a long-tenured donor's page doesn't grow unbounded; the total
    // below still reflects every donation, not just the ones displayed.
    const [donations, donationTotal] = await Promise.all([
        prisma.transaction.findMany({
            where: { memberId: member.id },
            orderBy: { createdAt: "desc" },
            take: 100,
            select: { id: true, amount: true, targetFund: true, isRecurring: true, createdAt: true },
        }),
        prisma.transaction.aggregate({ where: { memberId: member.id }, _sum: { amount: true } }),
    ]);
    const totalDonated = donationTotal._sum.amount ?? 0;

    return (
        <>
            <GatedHeader />
            <ProfileClient
                member={member}
                yahrzeits={member.yahrzeits}
                donations={donations}
                totalDonated={totalDonated}
            />
        </>
    );
}
