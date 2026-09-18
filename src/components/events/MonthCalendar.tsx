/** The Outlook-style month grid: a weekday header row and one cell per day. */

import type { ReactElement } from "react";

import type { CalendarEvent } from "../../api/eventApi";
import { buildMonthGrid, getWeekdayLabels, toDateKey } from "../../utils/calendarDates";
import { DayCell } from "./DayCell";

interface MonthCalendarProps {
  year: number;
  /** Month index, 0-11. */
  month: number;
  /** Events grouped under their local "YYYY-MM-DD" start day. */
  eventsByDay: Map<string, CalendarEvent[]>;
  selectedDay: string;
  canCreate: boolean;
  onSelectDay: (dayKey: string) => void;
  onCreateOnDay: (dayKey: string) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}

export function MonthCalendar({
  year,
  month,
  eventsByDay,
  selectedDay,
  canCreate,
  onSelectDay,
  onCreateOnDay,
  onOpenEvent,
}: MonthCalendarProps): ReactElement {
  const todayKey = toDateKey(new Date());

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-mint text-center text-xs font-bold uppercase tracking-wider text-mint sm:text-sm">
        {getWeekdayLabels().map((label) => (
          <div key={label} className="px-1 py-2.5">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {buildMonthGrid(year, month).map((day) => {
          const dayKey = toDateKey(day);
          return (
            <DayCell
              key={dayKey}
              day={day}
              isCurrentMonth={day.getMonth() === month}
              isToday={dayKey === todayKey}
              isSelected={dayKey === selectedDay}
              events={eventsByDay.get(dayKey) ?? []}
              canCreate={canCreate}
              onSelect={() => onSelectDay(dayKey)}
              onCreate={() => onCreateOnDay(dayKey)}
              onOpenEvent={onOpenEvent}
            />
          );
        })}
      </div>
    </div>
  );
}
