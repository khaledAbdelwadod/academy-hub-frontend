/** The super admin's "Fees" tab: every player's platform-fee subscription across academies, and who has paid. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import { buildFeesPath, changePlatformCycle, platformPaymentsPath } from "../api/adminPlatformSubscriptionApi";
import type { PlatformCycle, Subscription } from "../api/subscriptionApi";
import { PaymentsModal } from "../components/subscriptions/PaymentsModal";
import { SubscriptionStatusCell } from "../components/subscriptions/SubscriptionStatusCell";
import { KebabMenu } from "../components/ui/KebabMenu";
import type { KebabMenuItem } from "../components/ui/KebabMenu";
import { PagerFooter } from "../components/ui/PagerFooter";
import { SmallButton } from "../components/ui/SmallButton";
import { useFeeAcademies } from "../hooks/useFeeAcademies";
import { useSubscriptionList } from "../hooks/useSubscriptionList";
import { logger } from "../utils/logger";
import { describeBilling, formatMoney } from "../utils/subscriptionFormat";

const SEARCH_DEBOUNCE_MS = 300;
const FILTER_CLASS =
  "rounded-md border border-mint bg-white px-2 py-1.5 text-xs text-black focus:border-pine focus:outline-none";

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "expired", label: "Expired" },
  { value: "expiring", label: "Ending soon" },
  { value: "trial", label: "Free trial" },
  { value: "paid", label: "Paid" },
];

const CYCLE_NAMES: Record<PlatformCycle, string> = { monthly: "monthly", yearly: "yearly" };

export function FeesPage(): ReactElement {
  const [status, setStatus] = useState("");
  const [academy, setAcademy] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentsTarget, setPaymentsTarget] = useState<Subscription | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const academies = useFeeAcademies();
  const { page, isLoading, error, goTo, reload } = useSubscriptionList(
    buildFeesPath({ status, academy, q: debouncedSearch }),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  function handleChangeCycle(subscription: Subscription, cycle: PlatformCycle): void {
    const who = `${subscription.member.first_name} ${subscription.member.last_name}`;
    const hasPayments = subscription.paid_through !== null;
    const warning = `Switch ${who} to ${CYCLE_NAMES[cycle]}? Their recorded payments stay as they are; the new price applies to the next payment.`;
    if (hasPayments && !window.confirm(warning)) return;

    setActionError(null);
    changePlatformCycle(subscription.id, cycle)
      .then(reload)
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : "Could not change the billing cycle.";
        logger.error("Failed to change platform cycle", { error: message });
        setActionError(message);
      });
  }

  function menuItems(subscription: Subscription): KebabMenuItem[] {
    return (["monthly", "yearly"] as const)
      .filter((cycle) => cycle !== subscription.cycle)
      .map((cycle) => ({
        label: `Set ${CYCLE_NAMES[cycle]}`,
        onSelect: () => handleChangeCycle(subscription, cycle),
      }));
  }

  const rows = page?.results ?? [];

  return (
    <div className="mx-auto flex h-full w-full max-w-[900px] flex-col px-4 py-6 sm:px-8">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-mint px-4 py-3">
          <input
            type="search"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
            placeholder="Search player…"
            aria-label="Search players"
            className={`${FILTER_CLASS} w-40 placeholder:text-gray-400`}
          />
          <select
            value={academy}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setAcademy(event.target.value)}
            aria-label="Filter by academy"
            className={FILTER_CLASS}
          >
            <option value="">All academies</option>
            {academies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value)}
            aria-label="Filter by status"
            className={FILTER_CLASS}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {(actionError ?? error) && <p className="shrink-0 px-4 py-2 text-sm text-red-500">{actionError ?? error}</p>}

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-sm font-bold uppercase tracking-wider text-mint">
                <th className="whitespace-nowrap px-3 py-3">Academy</th>
                <th className="whitespace-nowrap px-3 py-3">Player</th>
                <th className="whitespace-nowrap px-3 py-3">Billing</th>
                <th className="whitespace-nowrap px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="divide-x divide-gray-300 border-b border-gray-300 text-black hover:bg-mint/10"
                >
                  <td className="px-3 py-3 font-semibold">{subscription.academy.name}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold">
                      {subscription.member.first_name} {subscription.member.last_name}
                    </p>
                    <p className="text-xs text-black/60 [overflow-wrap:anywhere]">{subscription.member.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p>{describeBilling(subscription)}</p>
                    {subscription.price !== null && (
                      <p className="text-xs text-black/60">{formatMoney(subscription.price, subscription.currency)}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <SubscriptionStatusCell subscription={subscription} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <SmallButton variant="primary" onClick={() => setPaymentsTarget(subscription)}>
                        Payments
                      </SmallButton>
                      <KebabMenu ariaLabel={`Billing cycle for ${subscription.member.first_name}`} items={menuItems(subscription)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && rows.length === 0 && <p className="py-10 text-center text-gray-500">Loading fees…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="py-10 text-center text-gray-400">
              {status || academy || debouncedSearch
                ? "No players match these filters."
                : "No platform fees yet - set a fee on an academy and its players will show up here."}
            </p>
          )}
        </div>

        <PagerFooter total={page?.count ?? null} previous={page?.previous ?? null} next={page?.next ?? null} onGoTo={goTo} />
      </div>

      {paymentsTarget && (
        <PaymentsModal
          subscription={paymentsTarget}
          paymentsPath={platformPaymentsPath(paymentsTarget.id)}
          onClose={() => setPaymentsTarget(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
