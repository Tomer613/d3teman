import Link from "next/link";
import { COMMUNITY_NAME, COMMUNITY_TAGLINE } from "@/lib/branding";
import CommunityLogo from "@/components/CommunityLogo";
import EventCard from "@/components/EventCard";
import { getUpcomingEvents } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getUpcomingEvents();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <CommunityLogo size="sm" />
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight block leading-tight">
                {COMMUNITY_NAME}
              </span>
              <span className="text-xs text-slate-500">{COMMUNITY_TAGLINE}</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/donate"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              תרומה
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              כניסת חברים
            </Link>
            <Link
              href="/directory"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              אלפון קהילתי
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">

        {/* Morale and Impact Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">משפחות בקהילה</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">68</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">↑ 4 משפחות חדשות ברבעון האחרון</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ריכוז אזורי</p>
            <p className="text-3xl font-extrabold text-slate-800 mt-2">8 רחובות</p>
            <p className="text-xs text-slate-500 font-medium mt-1">מרבית הקהילה במרחק 5 דק&apos; הליכה</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">שמחות קרובות</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">{events.length}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">אירועים מתוכננים בשבועות הקרובים</p>
          </div>
        </section>

        {/* Community Events & Celebrations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">שמחות ואירועים קרובים</h2>
            <span className="text-xs text-slate-500">מעודכן ללוח השבועי</span>
          </div>

          {events.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-sm text-slate-400">
              אין כרגע אירועים קרובים מתוכננים.
            </div>
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

        {/* Join Community Callout */}
        <section className="bg-linear-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-right">
            <h3 className="text-xl font-bold">עדיין לא רשומים בפורטל?</h3>
            <p className="text-amber-100 text-sm max-w-xl">
              ההרשמה לאתר מתבצעת בליווי הגבאים בלבד. לחצו למילוי פרטים קצר ואנו נחזור אליכם עם פרטי כניסה ראשוניים.
            </p>
          </div>
          <Link
            href="/join-request"
            className="whitespace-nowrap px-6 py-3 bg-white text-amber-800 font-semibold text-sm rounded-xl hover:bg-amber-50 shadow-sm transition-colors"
          >
            בקשת הצטרפות לקהילה
          </Link>
        </section>

      </main>
    </div>
  );
}