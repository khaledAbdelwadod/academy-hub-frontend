/** The "Events" tab: an Outlook-style month calendar of the academy's events, visible to every member. */

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import type { CalendarEvent } from "../api/eventApi";
import { CalendarToolbar } from "../components/events/CalendarToolbar";
import { DayAgenda } from "../components/events/DayAgenda";
import { EventDetailModal } from "../components/events/EventDetailModal";
import { EventFormModal } from "../components/events/EventFormModal";
import { MonthCalendar } from "../components/events/MonthCalendar";
import { useMonthEvents } from "../hooks/useMonthEvents";
import { formatMonthTitle, parseDateKey, toDateKey } from "../utils/calendarDates";
import { getAcademySubdomain } from "../utils/subdomain";

interface EventsPageProps {
  /** True for the academy's manager, admin, and coaches - the roles that may create events. */
  canCreate: boolean;
  /** The day ("YYYY-MM-DD") to open on (from a notification); defaults to today. */
  initialDay?: string;
  /** An event to open straight away (from a notification). */
  initialEventId?: number;
}

/** The event being written: `event` is null for a brand-new one starting on `day`. */
interface FormTarget {
  event: CalendarEvent | null;
  day: string;
}

function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = toDateKey(new Date(event.start));
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return groups;
}

/** Today when the month is the current one, otherwise the 1st - where the phone agenda starts. */
function defaultDayFor(year: number, month: number): string {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  return toDateKey(isCurrentMonth ? today : new Date(year, month, 1));
}

export function EventsPage({ canCreate, initialDay, initialEventId }: EventsPageProps): ReactElement {
  const subdomain = getAcademySubdomain();
  const startDay = initialDay ?? toDateKey(new Date());
  const [view, setView] = useState(() => {
    const start = parseDateKey(startDay);
    return { year: start.getFullYear(), month: start.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(startDay);
  const [detailId, setDetailId] = useState<number | null>(initialEventId ?? null);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const { events, isLoading, error, reload, replaceEvent } = useMonthEvents(subdomain, view.year, view.month);
  const eventsByDay = useMemo(() => groupByDay(events), [events]);
  const detailEvent = events.find((event) => event.id === detailId) ?? null;

  function showMonth(year: number, month: number): void {
    const shown = new Date(year, month, 1);
    setView({ year: shown.getFullYear(), month: shown.getMonth() });
    setSelectedDay(defaultDayFor(shown.getFullYear(), shown.getMonth()));
  }

  function openNewEvent(day: string): void {
    setSelectedDay(day);
    setFormTarget({ event: null, day });
  }

  function handleEdit(event: CalendarEvent): void {
    setDetailId(null);
    setFormTarget({ event, day: toDateKey(new Date(event.start)) });
  }

  function handleSaved(): void {
    setFormTarget(null);
    reload();
  }

  function handleDeleted(): void {
    setDetailId(null);
    reload();
  }

  if (!subdomain) {
    return <div className="min-h-full" />;
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-8">
      <div className="overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        <CalendarToolbar
          title={formatMonthTitle(view.year, view.month)}
          canCreate={canCreate}
          onPrevious={() => showMonth(view.year, view.month - 1)}
          onNext={() => showMonth(view.year, view.month + 1)}
          onToday={() => showMonth(new Date().getFullYear(), new Date().getMonth())}
          onNewEvent={() => openNewEvent(selectedDay)}
        />
        {error && <p className="border-b border-mint px-4 py-2 text-sm text-red-500">{error}</p>}
        {isLoading && !error && <p className="border-b border-mint px-4 py-2 text-sm text-black/50">Loading events…</p>}

        <MonthCalendar
          year={view.year}
          month={view.month}
          eventsByDay={eventsByDay}
          selectedDay={selectedDay}
          canCreate={canCreate}
          onSelectDay={setSelectedDay}
          onCreateOnDay={openNewEvent}
          onOpenEvent={(event) => setDetailId(event.id)}
        />
        <DayAgenda
          dayKey={selectedDay}
          events={eventsByDay.get(selectedDay) ?? []}
          canCreate={canCreate}
          onCreate={() => openNewEvent(selectedDay)}
          onOpenEvent={(event) => setDetailId(event.id)}
        />
      </div>

      {detailEvent && (
        <EventDetailModal
          subdomain={subdomain}
          event={detailEvent}
          onClose={() => setDetailId(null)}
          onEdit={() => handleEdit(detailEvent)}
          onChanged={replaceEvent}
          onDeleted={handleDeleted}
        />
      )}
      {formTarget && (
        <EventFormModal
          subdomain={subdomain}
          event={formTarget.event}
          defaultDay={formTarget.day}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
