/** API layer for the member's own subscriptions: the platform fee and any academy plans they hold. */

import { apiRequest } from "./apiClient";

export type SubscriptionStatus = "upcoming" | "trial" | "paid" | "expiring" | "expired" | "unpaid" | "ended";
export type SubscriptionKind = "platform" | "plan";
export type PlatformCycle = "monthly" | "yearly";
export type BillingType = "one_time" | "recurring" | "";
export type IntervalUnit = "day" | "week" | "month" | "year" | "";

/** One subscription with its status worked out for today. Dates are "YYYY-MM-DD"; money is a 2-decimal string. */
export interface Subscription {
  id: number;
  kind: SubscriptionKind;
  academy: { id: number; name: string; subdomain: string };
  member: {
    membership_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  plan: { id: number; name: string } | null;
  /** The platform fee's chosen cycle; null for plans, or while the player hasn't chosen yet. */
  cycle: PlatformCycle | null;
  billing_type: BillingType;
  interval_count: number | null;
  interval_unit: IntervalUnit;
  price: string | null;
  currency: string;
  started_on: string;
  ended_on: string | null;
  status: SubscriptionStatus;
  /** For the platform fee: may the player use the academy? Always true for plans. */
  access_ok: boolean;
  /** Last covered day of the latest recurring payment. */
  paid_through: string | null;
  /** The day the current coverage or trial ends. */
  ends_on: string | null;
  days_left: number | null;
  periods_due: number | null;
  next_period_start: string | null;
  /** Show a banner about this one (the last 5 days of coverage/trial, or an expired/unpaid plan). */
  is_alert: boolean;
}

/** What a player needs to pick a cycle and pay the platform fee. */
export interface PlatformFeeSummary {
  monthly: string | null;
  yearly: string | null;
  currency: string;
  trial_days: number;
  /** How to pay (bank/wallet details), set by the super admin. */
  instructions: string;
  available_cycles: PlatformCycle[];
}

export interface MySubscriptions {
  academy: { name: string; contact_phone: string };
  /** Null unless the viewer is a player at an academy that charges the platform fee. */
  platform_fee: PlatformFeeSummary | null;
  /** True when an unpaid platform fee currently blocks the viewer from the academy. */
  blocked: boolean;
  block_reason: SubscriptionStatus | null;
  subscriptions: Subscription[];
}

function subscriptionsPath(subdomain: string, suffix: string): string {
  return `/api/academies/${subdomain}/subscriptions/${suffix}`;
}

/**
 * Load the viewer's own subscriptions at an academy (reachable even while blocked).
 *
 * @param subdomain - The academy's subdomain.
 * @returns Their subscriptions with status, plus the platform fee summary and blocked flag.
 * @throws {ApiError} If the request fails.
 */
export async function fetchMySubscriptions(subdomain: string): Promise<MySubscriptions> {
  const response = await apiRequest("GET", subscriptionsPath(subdomain, "mine/"), {
    fallbackError: "Could not load your subscriptions.",
  });
  return (await response.json()) as MySubscriptions;
}

/**
 * Pick (or, before any payment, change) the platform fee's billing cycle.
 *
 * @param subdomain - The academy's subdomain.
 * @param cycle - "monthly" or "yearly".
 * @returns The updated platform subscription.
 * @throws {ApiError} If the academy doesn't offer that cycle or a payment is already recorded.
 */
export async function choosePlatformCycle(subdomain: string, cycle: PlatformCycle): Promise<Subscription> {
  const response = await apiRequest("POST", subscriptionsPath(subdomain, "mine/platform/"), {
    body: { cycle },
    fallbackError: "Could not save your choice.",
  });
  return (await response.json()) as Subscription;
}
