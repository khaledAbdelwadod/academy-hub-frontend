/** For an event's organiser/manager: who accepted, who declined, and who hasn't answered. */

import type { ReactElement } from "react";

import type { EventRecipient, ResponseState } from "../../api/eventApi";

interface EventResponseRosterProps {
  recipients: EventRecipient[];
}

const GROUPS: { status: ResponseState; label: string }[] = [
  { status: "accepted", label: "Accepted" },
  { status: "declined", label: "Declined" },
  { status: "pending", label: "No answer yet" },
];

export function EventResponseRoster({ recipients }: EventResponseRosterProps): ReactElement {
  if (recipients.length === 0) {
    return <p className="text-sm text-black/50">Nobody is invited yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {GROUPS.map(({ status, label }) => {
        const names = recipients
          .filter((recipient) => recipient.status === status)
          .map((recipient) => `${recipient.first_name} ${recipient.last_name}`);
        return (
          <p key={status} className="text-sm text-black/80">
            <span className="font-bold text-black">
              {label} ({names.length})
            </span>
            {names.length > 0 && <span className="text-black/70">: {names.join(", ")}</span>}
          </p>
        );
      })}
    </div>
  );
}
