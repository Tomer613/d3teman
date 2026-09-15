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
        prisma.family.count(),
        prisma.member.groupBy({ by: ["street"], where: { isApproved: true } }),
    ]);

    return { familyCount, streetCount: streets.length };
}
