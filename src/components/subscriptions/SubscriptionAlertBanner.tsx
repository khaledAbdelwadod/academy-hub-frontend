/** A strip under the nav warning that a subscription is about to end (or has lapsed). */

import type { ReactElement } from "react";

import type { Subscription } from "../../api/subscriptionApi";
import { alertMessage } from "../../utils/subscriptionFormat";

interface SubscriptionAlertBannerProps {
  alerts: Subscription[];
  /** Takes the member to where they can act on it (their Home, with the subscriptions card). */
  onView: () => void;
}

export function SubscriptionAlertBanner({ alerts, onView }: SubscriptionAlertBannerProps): ReactElement {
  return (
    <div className="relative z-10 mx-auto mt-3 w-full max-w-[900px] px-4 sm:px-8" role="status">
      <div className="flex items-start gap-3 rounded-2xl border border-sun bg-white/70 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-coral" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {alerts.map((subscription) => (
            <p key={subscription.id} className="text-sm text-black">
              {alertMessage(subscription)}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={onView}
          className="shrink-0 text-xs font-bold uppercase tracking-wide text-mint underline hover:text-pine"
        >
          View
        </button>
      </div>
    </div>
  );
}
