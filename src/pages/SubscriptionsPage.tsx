/** An academy manager/admin's "Subscriptions" tab: design plans, assign them to members, and track who has paid. */

import { useState } from "react";
import type { ReactElement } from "react";

import { PlansTab } from "../components/subscriptions/PlansTab";
import { SubscribersTab } from "../components/subscriptions/SubscribersTab";
import { TabStrip } from "../components/ui/TabStrip";
import { usePlans } from "../hooks/usePlans";
import { getAcademySubdomain } from "../utils/subdomain";

type SubscriptionsTab = "subscribers" | "plans";

const TABS: ReadonlyArray<{ id: SubscriptionsTab; label: string }> = [
  { id: "subscribers", label: "Subscribers" },
  { id: "plans", label: "Plans" },
];

export function SubscriptionsPage(): ReactElement {
  const subdomain = getAcademySubdomain();
  if (!subdomain) {
    return <div className="min-h-full" />;
  }
  return <SubscriptionsContent subdomain={subdomain} />;
}

function SubscriptionsContent({ subdomain }: { subdomain: string }): ReactElement {
  const { state: plansState, reload: reloadPlans } = usePlans(subdomain);
  const [chosenTab, setChosenTab] = useState<SubscriptionsTab | null>(null);
  // Until the manager picks a tab: Subscribers, or Plans when there's nothing to assign yet.
  const noPlansYet = plansState.status === "ready" && plansState.plans.length === 0;
  const activeTab = chosenTab ?? (noPlansYet ? "plans" : "subscribers");
  const plans = plansState.status === "ready" ? plansState.plans : [];

  return (
    <div className="mx-auto flex h-full w-full max-w-[900px] flex-col px-4 py-6 sm:px-8">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        <div className="shrink-0 border-b border-mint px-4 py-3">
          <TabStrip tabs={TABS} active={activeTab} onChange={setChosenTab} label="Subscriptions sections" />
        </div>

        {activeTab === "subscribers" ? (
          <SubscribersTab subdomain={subdomain} plans={plans} onPlansChanged={reloadPlans} />
        ) : (
          <PlansTab subdomain={subdomain} plansState={plansState} onChanged={reloadPlans} />
        )}
      </div>
    </div>
  );
}
