/** A modal showing one event: when, who it's for, and RSVP (invitee) or responses + edit/delete (organiser). */

import { useState } from "react";
import type { ReactElement, ReactNode } from "react";

import type { CalendarEvent } from "../../api/eventApi";
import { deleteEvent, respondToEvent } from "../../api/eventApi";
import { formatEventWhen } from "../../utils/calendarDates";
import { ModalShell } from "../ui/ModalShell";
import { SmallButton } from "../ui/SmallButton";
import { EventResponseRoster } from "./EventResponseRoster";
import { EventRsvpBar } from "./EventRsvpBar";

interface EventDetailModalProps {
  subdomain: string;
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  /** Called with the event's new state after the viewer changes their answer. */
  onChanged: (updated: CalendarEvent) => void;
  onDeleted: () => void;
}

function Section({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-black/80">{label}</span>
      {children}
    </div>
  );
}

/** The event's address and/or map link; renders nothing when neither was set. */
function LocationSection({ event }: { event: CalendarEvent }): ReactElement | null {
  if (!event.address && !event.google_maps_url) return null;

  return (
    <Section label="Location">
      {event.address && <p className="whitespace-pre-line text-sm text-black/80">{event.address}</p>}
      {event.google_maps_url && (
        <a
          href={event.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm text-mint underline hover:text-pine"
        >
          Open in Google Maps
        </a>
      )}
    </Section>
  );
}

function audienceNames(event: CalendarEvent): string {
  const teams = event.teams.map((team) => `${team.name} (team)`);
  const members = event.invitees.map((member) => `${member.first_name} ${member.last_name}`);
  return [...teams, ...members].join(", ");
}

export function EventDetailModal({
  subdomain,
  event,
  onClose,
  onEdit,
  onChanged,
  onDeleted,
}: EventDetailModalProps): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>, fallback: string): void {
    setBusy(true);
    setError(null);
    action()
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : fallback))
      .finally(() => setBusy(false));
  }

  function handleRespond(status: "accepted" | "declined"): void {
    run(() => respondToEvent(subdomain, event.id, status).then(onChanged), "Could not save your answer.");
  }

  function handleDelete(): void {
    if (!window.confirm(`Delete "${event.title}"? Everyone invited will be told it was cancelled.`)) return;
    run(() => deleteEvent(subdomain, event.id).then(onDeleted), "Could not delete that event.");
  }

  return (
    <ModalShell title={event.title} onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-5">
        <p className="text-base font-semibold text-black/80">{formatEventWhen(event.start, event.end)}</p>

        {event.description && <p className="whitespace-pre-line text-sm text-black/80">{event.description}</p>}

        <LocationSection event={event} />

        <Section label="Invited">
          <p className="text-sm text-black/80">{audienceNames(event)}</p>
        </Section>

        <Section label="Organiser">
          <p className="text-sm text-black/80">
            {event.created_by.first_name} {event.created_by.last_name}
          </p>
        </Section>

        {event.my_response !== null && (
          <EventRsvpBar current={event.my_response} disabled={busy} onRespond={handleRespond} />
        )}

        {event.can_edit && (
          <Section label="Responses">
            <EventResponseRoster recipients={event.recipients} />
          </Section>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {event.can_edit && (
          <div className="flex gap-2">
            <SmallButton variant="primary" disabled={busy} onClick={onEdit}>
              Edit
            </SmallButton>
            <SmallButton variant="danger" disabled={busy} onClick={handleDelete}>
              Delete
            </SmallButton>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
