"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export interface CommunityStats {
    familyCount: number;
    streetCount: number;
}

export async function getCommunityStats(): Promise<CommunityStats> {
    await requireSession();

    const [familyCount, streets] = await Promise.all([
        // Excludes a family whose members have all been deactivated - it
        // would otherwise keep inflating this "approved families" count
        // forever, since deactivating a member never touches the Family row.
        prisma.family.count({ where: { members: { some: { isApproved: true } } } }),
        prisma.member.groupBy({ by: ["street"], where: { isApproved: true } }),
    ]);

    return { familyCount, streetCount: streets.length };
}
