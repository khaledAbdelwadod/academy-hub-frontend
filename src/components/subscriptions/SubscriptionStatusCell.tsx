/** A table cell's worth of subscription status: the badge, where it stands, and how many periods are owed. */

import type { ReactElement } from "react";

import type { Subscription } from "../../api/subscriptionApi";
import { describeStatus } from "../../utils/subscriptionFormat";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

export function SubscriptionStatusCell({ subscription }: { subscription: Subscription }): ReactElement {
  const dueLabel =
    subscription.periods_due && (subscription.status === "unpaid" || subscription.status === "expired")
      ? `${subscription.periods_due} period${subscription.periods_due === 1 ? "" : "s"} due`
      : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <SubscriptionStatusBadge status={subscription.status} />
      <span className="text-xs text-black/70">{describeStatus(subscription)}</span>
      {dueLabel && <span className="text-xs font-bold text-red-500">{dueLabel}</span>}
    </div>
  );
}
