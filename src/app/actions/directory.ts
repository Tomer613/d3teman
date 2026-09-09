"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export interface DirectoryMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    halachicStatus: string;
    phone: string | null;
    street: string | null;
    city: string | null;
}

// Fetch approved members for the community directory. Members who opted out
// of showing their phone/address have those fields redacted server-side
// before the row ever reaches the client, rather than hidden only in the UI.
export async function getDirectoryMembers(): Promise<DirectoryMember[]> {
    await requireSession();

    const members = await prisma.member.findMany({
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
        },
    });

    return members.map((member) => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        halachicStatus: member.halachicStatus,
        phone: member.showPhoneInDirectory ? member.phone : null,
        street: member.showAddressInDirectory ? member.street : null,
        city: member.showAddressInDirectory ? member.city : null,
    }));
}
