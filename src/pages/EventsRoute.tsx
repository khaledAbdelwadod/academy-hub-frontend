/** Guards /events so only active members of that academy reach it; passes on a notification's target. */

import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAcademyMembership } from "../hooks/useAcademyMembership";
import { EventsPage } from "./EventsPage";

/** Roles allowed to create events (a coach only for their own teams - the server enforces that). */
const EVENT_CREATOR_ROLES = ["manager", "admin", "coach"];

/** Set on navigation when a notification asks to open a particular event. */
export interface EventsRouteState {
  eventId?: number;
  /** The event's day, "YYYY-MM-DD" in the viewer's timezone. */
  day?: string;
}

export function EventsRoute(): ReactElement {
  const membership = useAcademyMembership();
  const location = useLocation();

  if (membership.status === "loading") {
    return <div className="min-h-full" />;
  }

  if (membership.status !== "ready" || !membership.membership.is_member) {
    return <Navigate to="/myaccount/home" replace />;
  }

  const { roles } = membership.membership;
  const target = (location.state ?? {}) as EventsRouteState;

  // Keyed on the navigation itself, so opening a notification (or re-clicking the tab)
  // starts the page afresh instead of leaving it on whatever month it was showing.
  return (
    <EventsPage
      key={location.key}
      canCreate={roles.some((role) => EVENT_CREATOR_ROLES.includes(role))}
      initialDay={target.day}
      initialEventId={target.eventId}
    />
  );
}
