/** The calendar's header strip: month title, previous/today/next, and the "New event" button. */

import type { ReactElement } from "react";

import { SmallButton } from "../ui/SmallButton";

interface CalendarToolbarProps {
  title: string;
  canCreate: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
}

const ARROW_BUTTON_CLASS =
  "flex size-8 items-center justify-center rounded-lg border border-mint bg-white text-lg leading-none text-black/80 transition-colors hover:bg-mint/15";

export function CalendarToolbar({
  title,
  canCreate,
  onPrevious,
  onNext,
  onToday,
  onNewEvent,
}: CalendarToolbarProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mint px-4 py-3">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous month" onClick={onPrevious} className={ARROW_BUTTON_CLASS}>
          ‹
        </button>
        <button type="button" aria-label="Next month" onClick={onNext} className={ARROW_BUTTON_CLASS}>
          ›
        </button>
        <h1 className="ml-1 text-xl font-extrabold text-black">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <SmallButton onClick={onToday}>Today</SmallButton>
        {canCreate && (
          <SmallButton variant="primary" onClick={onNewEvent}>
            New event
          </SmallButton>
        )}
      </div>
    </div>
  );
}
