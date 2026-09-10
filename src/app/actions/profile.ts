"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { HEBREW_MONTHS, YAHRZEIT_RELATIONS } from "@/lib/yahrzeit";
import { revalidatePath } from "next/cache";

const HALACHIC_STATUSES = new Set(["kohen", "levi", "yisrael"]);
const RELATIONS = new Set<string>(YAHRZEIT_RELATIONS.map((r) => r.value));
const HEBREW_MONTH_SET = new Set<string>(HEBREW_MONTHS);

function clampChildCount(value: number): number {
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.min(Math.round(value), 50);
}

export interface UpdateProfileInput {
    halachicStatus: string;
    showPhoneInDirectory: boolean;
    showAddressInDirectory: boolean;
    receiveNewsletter: boolean;
    toddlerChildren: number;
    elementaryChildren: number;
    teenChildren: number;
}

export async function updateProfile(data: UpdateProfileInput) {
    try {
        const session = await requireSession();

        if (!HALACHIC_STATUSES.has(data.halachicStatus)) {
            return { success: false as const, error: "Invalid halachic status" };
        }

        await prisma.member.update({
            where: { id: session.sub },
            data: {
                halachicStatus: data.halachicStatus,
                showPhoneInDirectory: !!data.showPhoneInDirectory,
                showAddressInDirectory: !!data.showAddressInDirectory,
                receiveNewsletter: !!data.receiveNewsletter,
                toddlerChildren: clampChildCount(data.toddlerChildren),
                elementaryChildren: clampChildCount(data.elementaryChildren),
                teenChildren: clampChildCount(data.teenChildren),
            },
        });

        revalidatePath("/profile");
        revalidatePath("/directory");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Profile Error]:", error);
        return { success: false as const, error: "Failed to save profile" };
    }
}

export interface AddYahrzeitInput {
    deceasedName: string;
    relation: string;
    hebrewDay: number;
    hebrewMonth: string;
    diedAfterSunset: boolean;
    notes?: string;
}

export async function addYahrzeit(data: AddYahrzeitInput) {
    try {
        const session = await requireSession();

        const deceasedName = data.deceasedName.trim();
        if (!deceasedName) {
            return { success: false as const, error: "Deceased name is required" };
        }
        if (!RELATIONS.has(data.relation)) {
            return { success: false as const, error: "Invalid relation" };
        }
        if (!HEBREW_MONTH_SET.has(data.hebrewMonth)) {
            return { success: false as const, error: "Invalid Hebrew month" };
        }
        if (!Number.isInteger(data.hebrewDay) || data.hebrewDay < 1 || data.hebrewDay > 30) {
            return { success: false as const, error: "Invalid Hebrew day" };
        }

        await prisma.yahrzeit.create({
            data: {
                deceasedName,
                relation: data.relation,
                hebrewDay: data.hebrewDay,
                hebrewMonth: data.hebrewMonth,
                diedAfterSunset: !!data.diedAfterSunset,
                notes: data.notes?.trim() || null,
                memberId: session.sub,
            },
        });

        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Add Yahrzeit Error]:", error);
        return { success: false as const, error: "Failed to add yahrzeit" };
    }
}

export async function removeYahrzeit(id: string) {
    try {
        const session = await requireSession();

        // Ownership check - a member may only delete their own yahrzeit records.
        const existing = await prisma.yahrzeit.findUnique({ where: { id } });
        if (!existing || existing.memberId !== session.sub) {
            return { success: false as const, error: "Yahrzeit not found" };
        }

        await prisma.yahrzeit.delete({ where: { id } });

        revalidatePath("/profile");
        return { success: true as const };
    } catch (error) {
        console.error("[Remove Yahrzeit Error]:", error);
        return { success: false as const, error: "Failed to remove yahrzeit" };
    }
}
