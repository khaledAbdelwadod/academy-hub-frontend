/** One day of the month grid: its date number and that day's events (chips on wide screens, dots on phones). */

import type { MouseEvent, ReactElement } from "react";

import type { CalendarEvent } from "../../api/eventApi";
import { formatTime } from "../../utils/calendarDates";
import { eventToneClassName } from "./eventTone";

/** Most dots shown on a phone before the rest are implied by the agenda list below the grid. */
const MAX_DOTS = 3;

interface DayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  canCreate: boolean;
  onSelect: () => void;
  onCreate: () => void;
  onOpenEvent: (event: CalendarEvent) => void;
}

function EventChip({
  event,
  onOpen,
}: {
  event: CalendarEvent;
  onOpen: (event: CalendarEvent) => void;
}): ReactElement {
  function handleClick(mouseEvent: MouseEvent<HTMLButtonElement>): void {
    mouseEvent.stopPropagation();
    onOpen(event);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${formatTime(event.start)} ${event.title}`}
      className={`w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs font-semibold transition-colors hover:brightness-95 ${eventToneClassName(event)}`}
    >
      <span className="font-bold">{formatTime(event.start)}</span> {event.title}
    </button>
  );
}

export function DayCell({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  events,
  canCreate,
  onSelect,
  onCreate,
  onOpenEvent,
}: DayCellProps): ReactElement {
  function handleCreateClick(mouseEvent: MouseEvent<HTMLButtonElement>): void {
    mouseEvent.stopPropagation();
    onCreate();
  }

  return (
    <div
      onClick={onSelect}
      onDoubleClick={canCreate ? onCreate : undefined}
      className={`group flex min-h-16 cursor-pointer flex-col gap-1 border-b border-r border-gray-300 p-1 sm:min-h-[104px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0 ${
        isCurrentMonth ? "text-black" : "bg-black/[0.04] text-black/35"
      } ${isSelected ? "ring-2 ring-inset ring-mint" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex size-6 items-center justify-center rounded-full text-sm font-semibold ${
            isToday ? "bg-mint text-white" : ""
          }`}
        >
          {day.getDate()}
        </span>
        {canCreate && (
          <button
            type="button"
            aria-label={`New event on ${day.toDateString()}`}
            onClick={handleCreateClick}
            className="hidden size-6 items-center justify-center rounded-full text-lg leading-none text-mint opacity-0 transition-opacity hover:bg-mint/15 focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
          >
            +
          </button>
        )}
      </div>

      <div className="hidden flex-col gap-1 sm:flex">
        {events.map((event) => (
          <EventChip key={event.id} event={event} onOpen={onOpenEvent} />
        ))}
      </div>

      {events.length > 0 && (
        <div className="flex justify-center gap-0.5 sm:hidden" aria-label={`${events.length} events`}>
          {events.slice(0, MAX_DOTS).map((event) => (
            <span key={event.id} className="size-1.5 rounded-full bg-mint" />
          ))}
        </div>
      )}
    </div>
  );
}
