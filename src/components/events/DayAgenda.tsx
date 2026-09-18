/** Phone layout's list of the selected day's events (the month grid only has room for dots there). */

import type { ReactElement } from "react";

import type { CalendarEvent } from "../../api/eventApi";
import { formatDayLabel, formatTime } from "../../utils/calendarDates";
import { SmallButton } from "../ui/SmallButton";
import { eventToneClassName } from "./eventTone";

interface DayAgendaProps {
  dayKey: string;
  events: CalendarEvent[];
  canCreate: boolean;
  onCreate: () => void;
  onOpenEvent: (event: CalendarEvent) => void;
}

export function DayAgenda({ dayKey, events, canCreate, onCreate, onOpenEvent }: DayAgendaProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 border-t border-mint p-4 sm:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-black">{formatDayLabel(dayKey)}</h2>
        {canCreate && (
          <SmallButton variant="primary" onClick={onCreate}>
            New event
          </SmallButton>
        )}
      </div>

      {events.length === 0 && <p className="text-sm text-black/50">No events this day.</p>}
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onOpenEvent(event)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${eventToneClassName(event)}`}
        >
          <span className="shrink-0 font-bold">{formatTime(event.start)}</span>
          <span className="truncate">{event.title}</span>
        </button>
      ))}
    </div>
  );
}
