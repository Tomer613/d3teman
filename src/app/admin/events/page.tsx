import { requireAdminOrRedirect } from "@/lib/auth";
import { getAllEvents } from "@/app/actions/events";
import EventsClient from "./EventsClient";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
    await requireAdminOrRedirect();

    const events = await getAllEvents();

    return <EventsClient events={events} />;
}
