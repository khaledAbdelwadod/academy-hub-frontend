/** How an event is coloured on the calendar, by the viewer's own answer to it. */

import type { CalendarEvent } from "../../api/eventApi";

/** Declined events are struck through, accepted ones filled, everything else (pending/organiser) tinted. */
export function eventToneClassName(event: CalendarEvent): string {
  if (event.my_response === "declined") return "bg-black/5 text-black/45 line-through";
  if (event.my_response === "accepted") return "bg-mint text-white";
  return "bg-mint/20 text-pine";
}
