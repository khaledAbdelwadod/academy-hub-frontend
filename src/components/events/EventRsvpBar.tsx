/** Accept / Decline buttons for an invitee, showing which answer they've given. */

import type { ReactElement } from "react";

import type { ResponseState } from "../../api/eventApi";
import { SmallButton } from "../ui/SmallButton";

interface EventRsvpBarProps {
  current: ResponseState;
  disabled: boolean;
  onRespond: (status: "accepted" | "declined") => void;
}

const ANSWER_TEXT: Record<ResponseState, string> = {
  accepted: "You accepted",
  declined: "You declined",
  pending: "You haven't answered yet",
};

export function EventRsvpBar({ current, disabled, onRespond }: EventRsvpBarProps): ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mint bg-white px-4 py-3">
      <span className="text-sm font-semibold text-black/80">{ANSWER_TEXT[current]}</span>
      <div className="flex gap-2">
        <SmallButton
          variant={current === "accepted" ? "primary" : "default"}
          disabled={disabled}
          onClick={() => onRespond("accepted")}
        >
          Accept
        </SmallButton>
        <SmallButton
          variant={current === "declined" ? "danger" : "default"}
          disabled={disabled}
          onClick={() => onRespond("declined")}
        >
          Decline
        </SmallButton>
      </div>
    </div>
  );
}
