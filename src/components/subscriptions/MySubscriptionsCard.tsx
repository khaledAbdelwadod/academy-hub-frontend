/** The member's "Your subscriptions" card on their academy Home: status of each, and how to act on the platform fee. */

import type { ReactElement } from "react";

import type { MySubscriptions, Subscription } from "../../api/subscriptionApi";
import { useMySubscriptions } from "../../hooks/useMySubscriptions";
import { describeBilling, describeStatus, formatMoney, subscriptionTitle } from "../../utils/subscriptionFormat";
import { PlatformFeeDetails } from "./PlatformFeeDetails";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

interface MySubscriptionsCardProps {
  subdomain: string;
}

interface SubscriptionRowProps {
  subdomain: string;
  data: MySubscriptions;
  subscription: Subscription;
  onChanged: () => void;
}

function SubscriptionRow({ subdomain, data, subscription, onChanged }: SubscriptionRowProps): ReactElement {
  const needsAction = subscription.status !== "paid" && subscription.status !== "ended";
  const showFeeDetails = subscription.kind === "platform" && data.platform_fee !== null && needsAction;

  return (
    <li className="flex flex-col gap-3 border-t border-mint/40 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-extrabold text-black">{subscriptionTitle(subscription)}</p>
          <p className="text-sm text-black/70">
            {describeBilling(subscription)}
            {subscription.price !== null && ` · ${formatMoney(subscription.price, subscription.currency)}`}
          </p>
          <p className="mt-0.5 text-sm text-black">{describeStatus(subscription)}</p>
        </div>
        <SubscriptionStatusBadge status={subscription.status} />
      </div>

      {showFeeDetails && data.platform_fee && (
        <PlatformFeeDetails
          subdomain={subdomain}
          fee={data.platform_fee}
          subscription={subscription}
          contactPhone={data.academy.contact_phone}
          onChanged={onChanged}
        />
      )}
    </li>
  );
}

export function MySubscriptionsCard({ subdomain }: MySubscriptionsCardProps): ReactElement | null {
  const { state, reload } = useMySubscriptions(subdomain);
  if (state.status !== "ready" || state.data.subscriptions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-mint bg-white/40 px-5 py-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
      <h2 className="mb-4 text-xl font-extrabold text-black">Your subscriptions</h2>
      <ul className="flex flex-col">
        {state.data.subscriptions.map((subscription) => (
          <SubscriptionRow
            key={subscription.id}
            subdomain={subdomain}
            data={state.data}
            subscription={subscription}
            onChanged={reload}
          />
        ))}
      </ul>
    </section>
  );
}
