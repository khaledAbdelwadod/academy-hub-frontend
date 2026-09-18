/** Loads the events shown in one month of the calendar, and keeps them fresh after edits. */

import { useEffect, useState } from "react";

import type { CalendarEvent } from "../api/eventApi";
import { listEvents } from "../api/eventApi";
import { getGridRange } from "../utils/calendarDates";
import { logger } from "../utils/logger";

interface Snapshot {
  monthKey: string;
  /** Which reload produced this snapshot; a stale one means a reload is in flight. */
  version: number;
  events: CalendarEvent[];
  error: string | null;
}

export interface MonthEvents {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  /** Fetch the month again (after an event was created, edited, or deleted). */
  reload: () => void;
  /** Swap one event for its updated copy without refetching (after an RSVP). */
  replaceEvent: (updated: CalendarEvent) => void;
}

/**
 * Load the events for the month grid of `year`/`month`, reloading when the month changes.
 *
 * Events from a previously shown month are never returned for the current one, but during
 * a `reload()` the current month's old events stay visible so the grid doesn't flash empty.
 *
 * @param subdomain - The academy's subdomain, or null when not on an academy.
 * @param year - Full year.
 * @param month - Month index, 0-11.
 * @returns The month's events plus loading/error state and refresh helpers.
 */
export function useMonthEvents(subdomain: string | null, year: number, month: number): MonthEvents {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [version, setVersion] = useState(0);
  const monthKey = `${subdomain}:${year}-${month}`;

  useEffect(() => {
    if (!subdomain) return;
    let cancelled = false;
    const { start, end } = getGridRange(year, month);

    listEvents(subdomain, start, end)
      .then((events) => {
        if (!cancelled) setSnapshot({ monthKey, version, events, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load events.";
        logger.error("Failed to load events", { error: message });
        setSnapshot({ monthKey, version, events: [], error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [subdomain, year, month, monthKey, version]);

  const current = snapshot && snapshot.monthKey === monthKey ? snapshot : null;

  return {
    events: current?.events ?? [],
    isLoading: !current || current.version !== version,
    error: current?.error ?? null,
    reload: () => setVersion((value) => value + 1),
    replaceEvent: (updated) =>
      setSnapshot((previous) =>
        previous
          ? { ...previous, events: previous.events.map((event) => (event.id === updated.id ? updated : event)) }
          : previous,
      ),
  };
}
