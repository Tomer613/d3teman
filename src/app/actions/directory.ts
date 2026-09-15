"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export interface DirectoryMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    halachicStatus: string;
    phone: string | null;
    street: string | null;
    city: string | null;
    familyId: string | null;
    familyLabel: string | null; // e.g. "משפחת כהן", derived from the family head's lastName
    isOwnFamily: boolean;
    linkRequestPending: boolean;
}

// Fetch approved members for the community directory. Members who opted out
// of showing their phone/address have those fields redacted server-side
// before the row ever reaches the client, rather than hidden only in the UI.
export async function getDirectoryMembers(): Promise<DirectoryMember[]> {
    const session = await requireSession();

    const [members, viewer, pendingRequests] = await Promise.all([
        prisma.member.findMany({
            where: { isApproved: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                halachicStatus: true,
                phone: true,
                street: true,
                city: true,
                showPhoneInDirectory: true,
                showAddressInDirectory: true,
                familyId: true,
                family: { select: { head: { select: { lastName: true } } } },
            },
        }),
        prisma.member.findUnique({ where: { id: session.sub }, select: { familyId: true } }),
        prisma.familyLinkRequest.findMany({
            where: { requesterId: session.sub, status: "pending" },
            select: { targetFamilyId: true },
        }),
    ]);

    const pendingFamilyIds = new Set(pendingRequests.map((r) => r.targetFamilyId));

    return members.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        halachicStatus: member.halachicStatus,
        phone: member.showPhoneInDirectory ? member.phone : null,
        street: member.showAddressInDirectory ? member.street : null,
        city: member.showAddressInDirectory ? member.city : null,
        familyId: member.familyId,
        familyLabel: member.family ? `משפחת ${member.family.head.lastName}` : null,
        isOwnFamily: member.familyId !== null && member.familyId === viewer?.familyId,
        linkRequestPending: member.familyId !== null && pendingFamilyIds.has(member.familyId),
    }));
}
