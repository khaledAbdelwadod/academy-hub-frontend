/** A small coloured pill for a subscription's status: paid, free trial, ending soon, expired, ... */

import type { ReactElement } from "react";

import type { SubscriptionStatus } from "../../api/subscriptionApi";
import { STATUS_LABELS } from "../../utils/subscriptionFormat";

const TONE_CLASSES: Record<SubscriptionStatus, string> = {
  paid: "bg-teal/15 text-teal",
  trial: "bg-mint/15 text-pine",
  expiring: "bg-sun/40 text-black",
  expired: "bg-red-100 text-red-600",
  unpaid: "bg-red-100 text-red-600",
  upcoming: "bg-gray-100 text-gray-500",
  ended: "bg-gray-100 text-gray-500",
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }): ReactElement {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${TONE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
