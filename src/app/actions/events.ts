"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const EVENT_TYPES = new Set(["brit_yitzchak", "shabbat_chatan", "bar_mitzvah", "wedding", "general"]);

export interface CommunityEventRecord {
    id: string;
    title: string;
    type: string;
    description: string;
    eventDate: Date;
    eventDateLabel: string;
    location: string | null;
}

// Members-only read: the homepage is gated behind login, so this requires a
// session too - defense-in-depth alongside the page-level
// requireSessionOrRedirect() check, same pattern as getDirectoryMembers().
export async function getUpcomingEvents(limit = 6): Promise<CommunityEventRecord[]> {
    try {
        await requireSession();

        // eventDate is stored from a date-only <input type="date">, which JS
        // parses as UTC midnight - comparing against the current instant
        // (new Date()) would drop "today's" event a couple of hours into
        // Israel's local day. Comparing against today's UTC-midnight instead
        // keeps it visible for the whole calendar day it was entered as.
        const todayUtcMidnight = new Date(new Date().toISOString().slice(0, 10));
        return await prisma.communityEvent.findMany({
            where: { eventDate: { gte: todayUtcMidnight } },
            orderBy: { eventDate: "asc" },
            take: limit,
            select: {
                id: true,
                title: true,
                type: true,
                description: true,
                eventDate: true,
                eventDateLabel: true,
                location: true,
            },
        });
    } catch (error) {
        console.error("[Get Upcoming Events Error]:", error);
        return [];
    }
}

export async function getAllEvents(): Promise<CommunityEventRecord[]> {
    try {
        await requireAdmin();
        return await prisma.communityEvent.findMany({
            orderBy: { eventDate: "desc" },
            select: {
                id: true,
                title: true,
                type: true,
                description: true,
                eventDate: true,
                eventDateLabel: true,
                location: true,
            },
        });
    } catch (error) {
        console.error("[Get All Events Error]:", error);
        return [];
    }
}

export interface EventInput {
    id?: string;
    title: string;
    type: string;
    description: string;
    eventDate: string; // ISO date string from a <input type="date">
    eventDateLabel: string;
    location?: string;
}

function validateEventInput(data: EventInput) {
    if (!data.title.trim()) return "Title is required";
    if (!EVENT_TYPES.has(data.type)) return "Invalid event type";
    if (!data.description.trim()) return "Description is required";
    if (!data.eventDateLabel.trim()) return "Hebrew date label is required";
    const parsed = new Date(data.eventDate);
    if (Number.isNaN(parsed.getTime())) return "Invalid event date";
    return null;
}

export async function createEvent(data: EventInput) {
    try {
        await requireAdmin();

        const validationError = validateEventInput(data);
        if (validationError) {
            return { success: false as const, error: validationError };
        }

        await prisma.communityEvent.create({
            data: {
                title: data.title.trim(),
                type: data.type,
                description: data.description.trim(),
                eventDate: new Date(data.eventDate),
                eventDateLabel: data.eventDateLabel.trim(),
                location: data.location?.trim() || null,
            },
        });

        revalidatePath("/");
        revalidatePath("/admin/events");
        return { success: true as const };
    } catch (error) {
        console.error("[Create Event Error]:", error);
        return { success: false as const, error: "Failed to create event" };
    }
}

export async function updateEvent(data: EventInput) {
    try {
        await requireAdmin();

        if (!data.id) {
            return { success: false as const, error: "Missing event id" };
        }
        const validationError = validateEventInput(data);
        if (validationError) {
            return { success: false as const, error: validationError };
        }

        await prisma.communityEvent.update({
            where: { id: data.id },
            data: {
                title: data.title.trim(),
                type: data.type,
                description: data.description.trim(),
                eventDate: new Date(data.eventDate),
                eventDateLabel: data.eventDateLabel.trim(),
                location: data.location?.trim() || null,
            },
        });

        revalidatePath("/");
        revalidatePath("/admin/events");
        return { success: true as const };
    } catch (error) {
        console.error("[Update Event Error]:", error);
        return { success: false as const, error: "Failed to update event" };
    }
}

export async function deleteEvent(id: string) {
    try {
        await requireAdmin();

        await prisma.communityEvent.delete({ where: { id } });

        revalidatePath("/");
        revalidatePath("/admin/events");
        return { success: true as const };
    } catch (error) {
        console.error("[Delete Event Error]:", error);
        return { success: false as const, error: "Failed to delete event" };
    }
}
