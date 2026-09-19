/** Turning a subscription's raw fields into the text people read (money, dates, billing, status). */

import type { PlatformCycle, Subscription, SubscriptionStatus } from "../api/subscriptionApi";
import { parseDateKey } from "./calendarDates";

const CYCLE_LABELS: Record<PlatformCycle, string> = { monthly: "Monthly", yearly: "Yearly" };
const SINGLE_UNIT_LABELS: Record<string, string> = { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" };
const NOT_SET = "—";

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  upcoming: "Upcoming",
  trial: "Free trial",
  paid: "Paid",
  expiring: "Ending soon",
  expired: "Expired",
  unpaid: "Unpaid",
  ended: "Ended",
};

/**
 * Money as text, e.g. "1,000.00 EGP".
 *
 * @param amount - A 2-decimal string from the API, or null.
 * @param currency - A 3-letter currency code.
 * @returns The formatted amount, or a dash when there is none.
 */
export function formatMoney(amount: string | null, currency: string): string {
  if (amount === null) return NOT_SET;
  const formatted = Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${currency}`.trim();
}

/** A date-only value ("YYYY-MM-DD") as "5 Oct 2026", without a timezone shifting it a day. */
export function formatDay(value: string | null): string {
  if (!value) return NOT_SET;
  return parseDateKey(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** "Monthly", "Yearly", "Every 3 months", "One-time" - or "Not chosen yet" for a platform fee with no cycle. */
export function describeBilling(subscription: Subscription): string {
  if (subscription.kind === "platform") {
    return subscription.cycle ? CYCLE_LABELS[subscription.cycle] : "Not chosen yet";
  }
  if (subscription.billing_type === "one_time") return "One-time";
  const count = subscription.interval_count ?? 1;
  const unit = subscription.interval_unit;
  if (count === 1) return SINGLE_UNIT_LABELS[unit] ?? NOT_SET;
  return `Every ${count} ${unit}s`;
}

/** "today", "tomorrow", or "in 4 days (30 Sep 2026)" for a coverage/trial that ends on `endsOn`. */
export function describeWhen(daysLeft: number, endsOn: string | null): string {
  if (daysLeft <= 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  return `in ${daysLeft} days${endsOn ? ` (${formatDay(endsOn)})` : ""}`;
}

/** One short line saying where a subscription stands, e.g. "Paid until 30 Sep 2026". */
export function describeStatus(subscription: Subscription): string {
  const { status, days_left: daysLeft, ends_on: endsOn, paid_through: paidThrough } = subscription;
  switch (status) {
    case "trial":
      return daysLeft === null ? "Free trial" : `Free trial ends ${describeWhen(daysLeft, endsOn)}`;
    case "paid":
      return paidThrough ? `Paid until ${formatDay(paidThrough)}` : "Paid";
    case "expiring":
      return daysLeft === null ? "Ending soon" : `Ends ${describeWhen(daysLeft, endsOn)}`;
    case "expired":
      return `Expired on ${formatDay(paidThrough)}`;
    case "unpaid":
      return "Not paid yet";
    case "upcoming":
      return `Starts ${formatDay(subscription.started_on)}`;
    case "ended":
      return `Ended ${formatDay(subscription.ended_on)}`;
  }
}

/** The name people know a subscription by: "Platform fee" or the plan's name. */
export function subscriptionTitle(subscription: Subscription): string {
  return subscription.kind === "platform" ? "Platform fee" : (subscription.plan?.name ?? "Plan");
}

/** The sentence a banner shows for a subscription that needs attention. */
export function alertMessage(subscription: Subscription): string {
  const { status, days_left: daysLeft, ends_on: endsOn } = subscription;
  const when = daysLeft === null ? "soon" : describeWhen(daysLeft, endsOn);

  if (subscription.kind === "platform") {
    return status === "trial"
      ? `Your free trial ends ${when}. Choose a plan and pay to keep your access.`
      : `Your subscription ends ${when}. Renew to keep your access.`;
  }
  const title = subscriptionTitle(subscription);
  if (status === "expired") return `Your ${title} subscription has expired.`;
  if (status === "unpaid") return `Your ${title} subscription hasn't been paid yet.`;
  return `Your ${title} subscription ends ${when}.`;
}
