/** Shown instead of the academy's pages when an unpaid platform fee blocks a player. */

import type { ReactElement } from "react";

import type { MySubscriptions } from "../../api/subscriptionApi";
import { useMySubscriptions } from "../../hooks/useMySubscriptions";
import { PlatformFeeDetails } from "./PlatformFeeDetails";

interface SubscriptionBlockedGateProps {
  subdomain: string;
  academyName: string;
  academyLogo: string | null;
  /** "unpaid" (free trial over, nothing paid yet) or "expired" (a paid period ran out). */
  reason: "unpaid" | "expired" | null;
}

const CARD_CLASS =
  "w-full max-w-[520px] rounded-[22px] border border-mint bg-white/40 px-8 py-9 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:px-10";

function GateContent({
  subdomain,
  data,
  reload,
}: {
  subdomain: string;
  data: MySubscriptions;
  reload: () => void;
}): ReactElement | null {
  const platform = data.subscriptions.find((subscription) => subscription.kind === "platform");
  if (!platform || !data.platform_fee) return null;

  return (
    <div className="mt-6 flex flex-col gap-4 text-left">
      <PlatformFeeDetails
        subdomain={subdomain}
        fee={data.platform_fee}
        subscription={platform}
        contactPhone={data.academy.contact_phone}
        onChanged={reload}
      />
    </div>
  );
}

export function SubscriptionBlockedGate({
  subdomain,
  academyName,
  academyLogo,
  reason,
}: SubscriptionBlockedGateProps): ReactElement {
  const { state, reload } = useMySubscriptions(subdomain);
  const title = reason === "expired" ? "Your subscription has expired" : "Your free trial has ended";

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-10">
      {academyLogo && <img src={academyLogo} alt={academyName} className="mb-7 max-h-24 max-w-[280px] object-contain" />}

      <div className={CARD_CLASS}>
        <h2 className="text-center text-xl font-extrabold leading-tight text-black">{title}</h2>
        <p className="mx-auto mt-3 max-w-[400px] text-center text-[15px] leading-relaxed text-black/70">
          To keep training with {academyName}, complete your subscription payment. Your access comes back as soon as
          it&apos;s recorded.
        </p>

        {state.status === "loading" && <p className="mt-6 text-center text-sm text-black/50">Loading…</p>}
        {state.status === "error" && <p className="mt-6 text-center text-sm text-red-500">{state.message}</p>}
        {state.status === "ready" && <GateContent subdomain={subdomain} data={state.data} reload={reload} />}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mx-auto mt-7 block rounded-xl bg-mint px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-mint/85"
        >
          I&apos;ve paid - check again
        </button>
      </div>
    </div>
  );
}
