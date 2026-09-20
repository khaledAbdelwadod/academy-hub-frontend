/** The Subscriptions page's "Subscribers" sub-tab: who is on which plan, who has paid, and the actions on each. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { Plan } from "../../api/academySubscriptionApi";
import { buildSubscribersPath, endSubscription, subscriptionPaymentsPath } from "../../api/academySubscriptionApi";
import type { Subscription } from "../../api/subscriptionApi";
import { useSubscriptionList } from "../../hooks/useSubscriptionList";
import { logger } from "../../utils/logger";
import { describeInterval, formatMoney } from "../../utils/subscriptionFormat";
import { KebabMenu } from "../ui/KebabMenu";
import { PagerFooter } from "../ui/PagerFooter";
import { SmallButton } from "../ui/SmallButton";
import { AssignMembersModal } from "./AssignMembersModal";
import { PaymentsModal } from "./PaymentsModal";
import { SubscriptionStatusCell } from "./SubscriptionStatusCell";

const SEARCH_DEBOUNCE_MS = 300;
const FILTER_CLASS =
  "rounded-md border border-mint bg-white px-2 py-1.5 text-xs text-black focus:border-pine focus:outline-none";

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "expiring", label: "Ending soon" },
  { value: "expired", label: "Expired" },
  { value: "paid", label: "Paid" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

interface SubscribersTabProps {
  subdomain: string;
  /** Every plan (archived too) - for the plan filter; only active ones can be assigned. */
  plans: Plan[];
  /** Fetch the plans again (subscriber counts change when members are assigned). */
  onPlansChanged: () => void;
}

export function SubscribersTab({ subdomain, plans, onPlansChanged }: SubscribersTabProps): ReactElement {
  const [status, setStatus] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [paymentsTarget, setPaymentsTarget] = useState<Subscription | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { page, isLoading, error, goTo, reload } = useSubscriptionList(
    buildSubscribersPath(subdomain, { status, plan: planFilter, q: debouncedSearch }),
  );
  const activePlans = plans.filter((plan) => plan.is_active);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  function handleAssigned(result: { created: number; skipped: number }): void {
    setShowAssign(false);
    setActionError(null);
    const skipped = result.skipped > 0 ? ` (${result.skipped} already on that plan)` : "";
    setNotice(`Subscribed ${result.created} member${result.created === 1 ? "" : "s"}${skipped}.`);
    reload();
    onPlansChanged();
  }

  function handleEnd(subscription: Subscription): void {
    const who = `${subscription.member.first_name} ${subscription.member.last_name}`;
    if (!window.confirm(`End ${who}'s ${subscription.plan?.name ?? "plan"} subscription? Their payment history is kept.`)) return;
    setNotice(null);
    setActionError(null);
    endSubscription(subdomain, subscription.id)
      .then(() => {
        reload();
        onPlansChanged();
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Could not end that subscription.";
        logger.error("Failed to end subscription", { error: message });
        setActionError(message);
      });
  }

  const rows = page?.results ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-mint px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          placeholder="Search member…"
          aria-label="Search members"
          className={`${FILTER_CLASS} w-40 placeholder:text-gray-400`}
        />
        <select
          value={planFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanFilter(event.target.value)}
          aria-label="Filter by plan"
          className={FILTER_CLASS}
        >
          <option value="">All plans</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}
          aria-label="Filter by status"
          className={FILTER_CLASS}
        >
          <option value="">Current</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SmallButton
          variant="primary"
          className="ml-auto"
          disabled={activePlans.length === 0}
          title={activePlans.length === 0 ? "Create a plan first" : undefined}
          onClick={() => setShowAssign(true)}
        >
          Assign members
        </SmallButton>
      </div>

      {notice && <p className="shrink-0 px-4 pt-2 text-sm text-teal">{notice}</p>}
      {(actionError ?? error) && <p className="shrink-0 px-4 py-2 text-sm text-red-500">{actionError ?? error}</p>}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-sm font-bold uppercase tracking-wider text-mint">
              <th className="whitespace-nowrap px-3 py-3">Member</th>
              <th className="whitespace-nowrap px-3 py-3">Plan</th>
              <th className="whitespace-nowrap px-3 py-3">Price</th>
              <th className="whitespace-nowrap px-3 py-3">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((subscription) => (
              <tr key={subscription.id} className="divide-x divide-gray-300 border-b border-gray-300 text-black hover:bg-mint/10">
                <td className="px-3 py-3">
                  <p className="font-semibold">
                    {subscription.member.first_name} {subscription.member.last_name}
                  </p>
                  <p className="text-xs capitalize text-black/60">{subscription.member.role}</p>
                </td>
                <td className="px-3 py-3">
                  <p>{subscription.plan?.name}</p>
                  <p className="text-xs text-black/60">
                    {describeInterval(subscription.billing_type, subscription.interval_count, subscription.interval_unit)}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-3">{formatMoney(subscription.price, subscription.currency)}</td>
                <td className="px-3 py-3">
                  <SubscriptionStatusCell subscription={subscription} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <SmallButton variant="primary" onClick={() => setPaymentsTarget(subscription)}>
                      Payments
                    </SmallButton>
                    {subscription.status !== "ended" && (
                      <KebabMenu
                        ariaLabel={`Actions for ${subscription.member.first_name}`}
                        items={[{ label: "End subscription", onSelect: () => handleEnd(subscription), danger: true }]}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && rows.length === 0 && <p className="py-10 text-center text-gray-500">Loading subscribers…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="py-10 text-center text-gray-400">
            {status || planFilter || debouncedSearch
              ? "No subscriptions match these filters."
              : "Nobody is subscribed yet - assign a plan to your members."}
          </p>
        )}
      </div>

      <PagerFooter total={page?.count ?? null} previous={page?.previous ?? null} next={page?.next ?? null} onGoTo={goTo} />

      {showAssign && (
        <AssignMembersModal
          subdomain={subdomain}
          plans={activePlans}
          onClose={() => setShowAssign(false)}
          onAssigned={handleAssigned}
        />
      )}
      {paymentsTarget && (
        <PaymentsModal
          subscription={paymentsTarget}
          paymentsPath={subscriptionPaymentsPath(subdomain, paymentsTarget.id)}
          onClose={() => setPaymentsTarget(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
