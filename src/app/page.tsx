import { requireSessionOrRedirect } from "@/lib/auth";
import { getUpcomingEvents } from "@/app/actions/events";
import { getCommunityStats } from "@/app/actions/dashboard";
import GatedHeader from "@/components/layout/GatedHeader";
import DecorativePattern from "@/components/ui/DecorativePattern";
import Card from "@/components/ui/Card";
import EventCard from "@/components/EventCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireSessionOrRedirect();

  const [events, stats] = await Promise.all([getUpcomingEvents(), getCommunityStats()]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GatedHeader />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">

        {/* Hero band */}
        <section className="relative overflow-hidden rounded-2xl bg-primary text-white p-6 sm:p-8">
          <DecorativePattern variant="arabesque-border" className="absolute inset-0" />
          <div className="relative">
            <h1 className="text-xl sm:text-2xl font-bold">ברוכים הבאים לפורטל הקהילה</h1>
            <p className="text-sm text-white/80 mt-1">
              כאן תמצאו את השמחות והאירועים הקרובים, ונתוני הקהילה המעודכנים
            </p>
          </div>
        </section>

        {/* Community stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">משפחות בקהילה</p>
            <p className="text-3xl font-extrabold text-text mt-2">{stats.familyCount}</p>
            <p className="text-xs text-text-muted font-medium mt-1">מספר משפחות מאושרות במערכת</p>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">ריכוז אזורי</p>
            <p className="text-3xl font-extrabold text-text mt-2">{stats.streetCount} רחובות</p>
            <p className="text-xs text-text-muted font-medium mt-1">פריסת הקהילה בשכונה</p>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">שמחות קרובות</p>
            <p className="text-3xl font-extrabold text-accent mt-2">{events.length}</p>
            <p className="text-xs text-text-muted font-medium mt-1">אירועים מתוכננים בשבועות הקרובים</p>
          </Card>
        </section>

        {/* Community events & celebrations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">שמחות ואירועים קרובים</h2>
            <span className="text-xs text-text-muted">מעודכן ללוח השבועי</span>
          </div>

          {events.length === 0 ? (
            <Card className="text-center text-sm text-text-muted" padding="lg">
              אין כרגע אירועים קרובים מתוכננים.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  type={event.type}
                  description={event.description}
                  eventDateLabel={event.eventDateLabel}
                  location={event.location}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
