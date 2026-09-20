/** The Subscriptions page's "Plans" sub-tab: the plans the manager designed, with create/edit/archive/delete. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { Plan } from "../../api/academySubscriptionApi";
import { deletePlan, updatePlan } from "../../api/academySubscriptionApi";
import type { PlansState } from "../../hooks/usePlans";
import { logger } from "../../utils/logger";
import { describeInterval, formatMoney } from "../../utils/subscriptionFormat";
import { KebabMenu } from "../ui/KebabMenu";
import type { KebabMenuItem } from "../ui/KebabMenu";
import { SmallButton } from "../ui/SmallButton";
import { PlanFormModal } from "./PlanFormModal";

interface PlansTabProps {
  subdomain: string;
  plansState: PlansState;
  /** Fetch the plans again after any change. */
  onChanged: () => void;
}

function ActiveBadge({ isActive }: { isActive: boolean }): ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
        isActive ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
      }`}
    >
      {isActive ? "Active" : "Archived"}
    </span>
  );
}

export function PlansTab({ subdomain, plansState, onChanged }: PlansTabProps): ReactElement {
  const [formTarget, setFormTarget] = useState<Plan | "create" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const plans = plansState.status === "ready" ? plansState.plans : [];

  function handleSaved(): void {
    setFormTarget(null);
    onChanged();
  }

  function runAction(action: Promise<unknown>, fallback: string): void {
    setActionError(null);
    action.then(onChanged).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : fallback;
      logger.error("Plan action failed", { error: message });
      setActionError(message);
    });
  }

  function handleDelete(plan: Plan): void {
    if (!window.confirm(`Delete the plan "${plan.name}"?`)) return;
    runAction(deletePlan(subdomain, plan.id), "Could not delete that plan.");
  }

  function menuItems(plan: Plan): KebabMenuItem[] {
    return [
      { label: "Edit", onSelect: () => setFormTarget(plan) },
      {
        label: plan.is_active ? "Archive" : "Restore",
        onSelect: () => runAction(updatePlan(subdomain, plan.id, { is_active: !plan.is_active }), "Could not update that plan."),
      },
      { label: "Delete", onSelect: () => handleDelete(plan), danger: true },
    ];
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-mint px-4 py-3">
        <p className="text-sm text-black/70">
          Design your own plans, then assign them to members from the Subscribers tab.
        </p>
        <SmallButton variant="primary" onClick={() => setFormTarget("create")}>
          New plan
        </SmallButton>
      </div>

      {actionError && <p className="shrink-0 px-4 py-2 text-sm text-red-500">{actionError}</p>}
      {plansState.status === "error" && <p className="shrink-0 px-4 py-2 text-sm text-red-500">{plansState.message}</p>}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-sm font-bold uppercase tracking-wider text-mint">
              <th className="whitespace-nowrap px-3 py-3">Plan</th>
              <th className="whitespace-nowrap px-3 py-3">Price</th>
              <th className="whitespace-nowrap px-3 py-3">Billing</th>
              <th className="whitespace-nowrap px-3 py-3">Subscribers</th>
              <th className="whitespace-nowrap px-3 py-3">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="divide-x divide-gray-300 border-b border-gray-300 text-black hover:bg-mint/10">
                <td className="px-3 py-3">
                  <p className="font-semibold">{plan.name}</p>
                  {plan.description && <p className="text-xs text-black/60">{plan.description}</p>}
                </td>
                <td className="whitespace-nowrap px-3 py-3">{formatMoney(plan.price, plan.currency)}</td>
                <td className="px-3 py-3">
                  {describeInterval(plan.billing_type, plan.interval_count, plan.interval_unit)}
                </td>
                <td className="px-3 py-3 tabular-nums">{plan.subscriber_count}</td>
                <td className="px-3 py-3">
                  <ActiveBadge isActive={plan.is_active} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <KebabMenu ariaLabel={`Actions for ${plan.name}`} items={menuItems(plan)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {plansState.status === "loading" && <p className="py-10 text-center text-gray-500">Loading plans…</p>}
        {plansState.status === "ready" && plans.length === 0 && (
          <p className="py-10 text-center text-gray-400">No plans yet - create your first one above.</p>
        )}
      </div>

      {formTarget !== null && (
        <PlanFormModal
          subdomain={subdomain}
          plan={formTarget === "create" ? null : formTarget}
          defaultCurrency={plans[0]?.currency ?? ""}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
