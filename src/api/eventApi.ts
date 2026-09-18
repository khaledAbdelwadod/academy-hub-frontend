/** API layer for an academy's event calendar: events, RSVPs, and who can be invited. */

import { apiRequest } from "./apiClient";

/** An invitee's answer to an event; "pending" means they haven't answered yet. */
export type ResponseState = "accepted" | "declined" | "pending";

export interface EventPerson {
  id: number;
  first_name: string;
  last_name: string;
}

export interface EventTeamRef {
  id: number;
  name: string;
}

/** A member (by membership id) who was invited individually, with the role they were invited under. */
export interface EventInvitee extends EventPerson {
  role: string;
}

/** One person the event reaches, with their answer - only sent to someone who can edit the event. */
export interface EventRecipient {
  user_id: number;
  first_name: string;
  last_name: string;
  status: ResponseState;
}

export interface ResponseCounts {
  accepted: number;
  declined: number;
  pending: number;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  /** ISO datetime (UTC). */
  start: string;
  end: string;
  created_by: EventPerson;
  teams: EventTeamRef[];
  invitees: EventInvitee[];
  can_edit: boolean;
  /** The viewer's own answer, or null when they aren't one of the people invited (e.g. the organiser). */
  my_response: ResponseState | null;
  recipients: EventRecipient[];
  response_counts: ResponseCounts | null;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  description: string;
  start: string;
  end: string;
  team_ids: number[];
  invitee_ids: number[];
}

/** The teams and members the viewer may invite - a coach only gets their own teams and those teams' players. */
export interface AudienceOptions {
  teams: EventTeamRef[];
  members: EventInvitee[];
}

function eventsPath(subdomain: string, suffix = ""): string {
  return `/api/academies/${subdomain}/events/${suffix}`;
}

/**
 * List the events the viewer can see that start inside a date window.
 *
 * @param subdomain - The academy's subdomain.
 * @param rangeStart - Start of the window (inclusive).
 * @param rangeEnd - End of the window (exclusive).
 * @returns The events, earliest first.
 * @throws {ApiError} If the request fails.
 */
export async function listEvents(subdomain: string, rangeStart: Date, rangeEnd: Date): Promise<CalendarEvent[]> {
  const query = new URLSearchParams({ start: rangeStart.toISOString(), end: rangeEnd.toISOString() });
  const response = await apiRequest("GET", eventsPath(subdomain, `?${query.toString()}`), {
    fallbackError: "Could not load events.",
  });
  return (await response.json()) as CalendarEvent[];
}

/**
 * Create an event and notify everyone it invites.
 *
 * @param subdomain - The academy's subdomain.
 * @param data - The event's details and audience.
 * @returns The created event.
 * @throws {ApiError} If the request is invalid or fails.
 */
export async function createEvent(subdomain: string, data: EventInput): Promise<CalendarEvent> {
  const response = await apiRequest("POST", eventsPath(subdomain), {
    body: data,
    fallbackError: "Could not create that event.",
  });
  return (await response.json()) as CalendarEvent;
}

/**
 * Edit an event; newly invited people are notified, and everyone if its time moved.
 *
 * @param subdomain - The academy's subdomain.
 * @param eventId - The event's id.
 * @param data - The full set of editable fields.
 * @returns The updated event.
 * @throws {ApiError} If the request is invalid or fails.
 */
export async function updateEvent(subdomain: string, eventId: number, data: EventInput): Promise<CalendarEvent> {
  const response = await apiRequest("PATCH", eventsPath(subdomain, `${eventId}/`), {
    body: data,
    fallbackError: "Could not save that event.",
  });
  return (await response.json()) as CalendarEvent;
}

/**
 * Delete an event; the people it invited are told it was cancelled.
 *
 * @param subdomain - The academy's subdomain.
 * @param eventId - The event's id.
 * @throws {ApiError} If the request fails.
 */
export async function deleteEvent(subdomain: string, eventId: number): Promise<void> {
  await apiRequest("DELETE", eventsPath(subdomain, `${eventId}/`), { fallbackError: "Could not delete that event." });
}

/**
 * Accept or decline an event you're invited to (or change a previous answer).
 *
 * @param subdomain - The academy's subdomain.
 * @param eventId - The event's id.
 * @param status - "accepted" or "declined".
 * @returns The updated event.
 * @throws {ApiError} If the request fails or you aren't invited.
 */
export async function respondToEvent(
  subdomain: string,
  eventId: number,
  status: "accepted" | "declined",
): Promise<CalendarEvent> {
  const response = await apiRequest("PUT", eventsPath(subdomain, `${eventId}/response/`), {
    body: { status },
    fallbackError: "Could not save your answer.",
  });
  return (await response.json()) as CalendarEvent;
}

/**
 * Load who the viewer may invite to an event - feeds the event form's pickers.
 *
 * @param subdomain - The academy's subdomain.
 * @returns Invitable teams and members.
 * @throws {ApiError} If the request fails.
 */
export async function getAudienceOptions(subdomain: string): Promise<AudienceOptions> {
  const response = await apiRequest("GET", eventsPath(subdomain, "audience-options/"), {
    fallbackError: "Could not load who you can invite.",
  });
  return (await response.json()) as AudienceOptions;
}
