/** What a player does about the platform fee: pick monthly/yearly (before paying), and how to pay. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { PlatformCycle, PlatformFeeSummary, Subscription } from "../../api/subscriptionApi";
import { choosePlatformCycle } from "../../api/subscriptionApi";
import { logger } from "../../utils/logger";
import { formatMoney } from "../../utils/subscriptionFormat";
import { PlatformCyclePicker } from "./PlatformCyclePicker";

interface PlatformFeeDetailsProps {
  subdomain: string;
  fee: PlatformFeeSummary;
  subscription: Subscription;
  /** The academy's phone number, shown as a fallback for questions. */
  contactPhone: string;
  /** Called after the player picks a cycle, so the parent can reload their subscriptions. */
  onChanged: () => void;
}

function PayInstructions({ text }: { text: string }): ReactElement {
  return (
    <div className="rounded-xl border border-mint bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-black/50">How to pay</p>
      <p className="mt-1 whitespace-pre-line text-sm text-black">{text}</p>
    </div>
  );
}

export function PlatformFeeDetails({
  subdomain,
  fee,
  subscription,
  contactPhone,
  onChanged,
}: PlatformFeeDetailsProps): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Once a payment is on record only the super admin can change the cycle.
  const canChoose = subscription.paid_through === null && fee.available_cycles.length > 0;

  function handleChoose(cycle: PlatformCycle): void {
    setBusy(true);
    setError(null);
    choosePlatformCycle(subdomain, cycle)
      .then(onChanged)
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Could not save your choice.";
        logger.error("Failed to choose platform cycle", { error: message });
        setError(message);
      })
      .finally(() => setBusy(false));
  }

  return (
    <div className="flex flex-col gap-3">
      {canChoose ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-black/50">
            {subscription.cycle ? "Your plan" : "Choose how you'd like to pay"}
          </p>
          <PlatformCyclePicker fee={fee} current={subscription.cycle} disabled={busy} onChoose={handleChoose} />
        </div>
      ) : (
        subscription.cycle && (
          <p className="text-sm text-black">
            Amount due: <span className="font-bold">{formatMoney(subscription.price, subscription.currency)}</span>{" "}
            {subscription.cycle === "monthly" ? "per month" : "per year"}
          </p>
        )
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {fee.instructions && <PayInstructions text={fee.instructions} />}
      {contactPhone && (
        <p className="text-sm text-black/70">
          Questions? Call{" "}
          <a href={`tel:${contactPhone}`} className="font-bold text-mint underline">
            {contactPhone}
          </a>
        </p>
      )}
    </div>
  );
}
