/** Date helpers for the month calendar: grid layout, local day keys, and display/input formatting. */

/** The weekday a calendar row starts on (0 = Sunday, 1 = Monday, ...). */
export const WEEK_START_DAY = 0;

const DAYS_PER_WEEK = 7;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
/** A year whose January 1st is a Sunday - a fixed anchor for localised weekday names. */
const SUNDAY_JAN_FIRST_YEAR = 2023;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * The local calendar day of a date as "YYYY-MM-DD" - the key events are grouped under.
 *
 * @param date - Any date.
 * @returns The key for that date's day in the viewer's own timezone.
 */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Turn a "YYYY-MM-DD" day key back into local midnight of that day.
 *
 * @param key - A key from {@link toDateKey}.
 * @returns The date at 00:00 local time.
 */
export function parseDateKey(key: string): Date {
  const [year = 0, month = 1, day = 1] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Every day shown for a month: whole weeks, padded with the neighbouring months' days.
 *
 * @param year - Full year.
 * @param month - Month index, 0-11.
 * @returns The days in reading order, a multiple of 7 long.
 */
export function buildMonthGrid(year: number, month: number): Date[] {
  const leadingDays = (new Date(year, month, 1).getDay() - WEEK_START_DAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((leadingDays + daysInMonth) / DAYS_PER_WEEK);
  return Array.from({ length: weeks * DAYS_PER_WEEK }, (_, index) => new Date(year, month, 1 - leadingDays + index));
}

/**
 * The time window covering the whole visible grid - what to ask the API for.
 *
 * @param year - Full year.
 * @param month - Month index, 0-11.
 * @returns Local midnight of the first shown day, and of the day after the last one.
 */
export function getGridRange(year: number, month: number): { start: Date; end: Date } {
  const grid = buildMonthGrid(year, month);
  const first = grid[0] as Date;
  const last = grid[grid.length - 1] as Date;
  return { start: first, end: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1) };
}

/** Short weekday names in the order the grid shows them, in the viewer's language. */
export function getWeekdayLabels(): string[] {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) =>
    formatter.format(new Date(SUNDAY_JAN_FIRST_YEAR, 0, 1 + WEEK_START_DAY + index)),
  );
}

/** "September 2026" for the calendar header. */
export function formatMonthTitle(year: number, month: number): string {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}

/** "Sat, 5 Sep" style label for a day key. */
export function formatDayLabel(key: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(
    parseDateKey(key),
  );
}

/** The time of an ISO datetime in the viewer's timezone, e.g. "4:00 PM". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "Sat, 5 Sep 2026 · 4:00 PM – 5:30 PM" for an event's start and end. */
export function formatEventWhen(startIso: string, endIso: string): string {
  const day = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(startIso));
  return `${day} · ${formatTime(startIso)} – ${formatTime(endIso)}`;
}

/** "Sat, 5 Sep, 4:00 PM" - a day and time, for lists like notifications. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The time of a date as an `<input type="time">` value, "HH:MM". */
export function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Combine a day key and an "HH:MM" time into one local date.
 *
 * @param dateKey - "YYYY-MM-DD".
 * @param time - "HH:MM".
 * @returns That moment in the viewer's timezone.
 */
export function combineDateAndTime(dateKey: string, time: string): Date {
  const day = parseDateKey(dateKey);
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

/**
 * Move an "HH:MM" time by some minutes, staying within the same day.
 *
 * @param time - "HH:MM".
 * @param minutes - How far to move it; may be negative.
 * @returns The new "HH:MM", clamped to 00:00-23:59.
 */
export function shiftTime(time: string, minutes: number): string {
  const [hours = 0, mins = 0] = time.split(":").map(Number);
  const total = Math.min(Math.max(hours * MINUTES_PER_HOUR + mins + minutes, 0), MINUTES_PER_DAY - 1);
  return `${pad(Math.floor(total / MINUTES_PER_HOUR))}:${pad(total % MINUTES_PER_HOUR)}`;
}

/** Minutes between two "HH:MM" times on the same day (negative if `to` is earlier). */
export function minutesBetween(from: string, to: string): number {
  const toMinutes = (time: string): number => {
    const [hours = 0, mins = 0] = time.split(":").map(Number);
    return hours * MINUTES_PER_HOUR + mins;
  };
  return toMinutes(to) - toMinutes(from);
}
