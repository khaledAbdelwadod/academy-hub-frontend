/** API layer for an academy manager/admin: designing plans, assigning them to members, and tracking who paid. */

import { apiRequest, pathFromUrl } from "./apiClient";
import type { BillingType, Subscription } from "./subscriptionApi";

export type PlanBillingType = Exclude<BillingType, "">;
export type PlanIntervalUnit = "day" | "week" | "month" | "year";

/** A plan the manager designed: what it costs and how often it repeats. */
export interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: string;
  billing_type: PlanBillingType;
  interval_count: number | null;
  interval_unit: PlanIntervalUnit | "";
  /** False once archived: it can't be assigned to more members. */
  is_active: boolean;
  subscriber_count: number;
  created_at: string;
}

export interface PlanInput {
  name: string;
  description: string;
  price: string;
  currency: string;
  billing_type: PlanBillingType;
  /** Required when the plan repeats; ignored for one-time plans. */
  interval_count: number | null;
  interval_unit: PlanIntervalUnit | "";
  is_active?: boolean;
}

export interface SubscriberList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subscription[];
}

/** Filters for the subscribers table; empty values are left out of the request. */
export interface SubscriberFilters {
  status: string;
  plan: string;
  q: string;
}

export interface AssignPlanInput {
  plan_id: number;
  membership_ids: number[];
  /** "YYYY-MM-DD"; defaults to today on the server. */
  started_on?: string;
}

function plansPath(subdomain: string, suffix = ""): string {
  return `/api/academies/${subdomain}/subscription-plans/${suffix}`;
}

/**
 * List the academy's plans, archived ones included, each with its subscriber count.
 *
 * @throws {ApiError} If the request fails.
 */
export async function listPlans(subdomain: string): Promise<Plan[]> {
  const response = await apiRequest("GET", plansPath(subdomain), { fallbackError: "Could not load plans." });
  return (await response.json()) as Plan[];
}

/**
 * Create a plan.
 *
 * @throws {ApiError} If a field is invalid (e.g. a recurring plan with no interval).
 */
export async function createPlan(subdomain: string, input: PlanInput): Promise<Plan> {
  const response = await apiRequest("POST", plansPath(subdomain), {
    body: input,
    fallbackError: "Could not create that plan.",
  });
  return (await response.json()) as Plan;
}

/**
 * Edit a plan (or archive/restore it with `is_active`). Members already on it keep their price and interval.
 *
 * @throws {ApiError} If a field is invalid.
 */
export async function updatePlan(subdomain: string, planId: number, input: Partial<PlanInput>): Promise<Plan> {
  const response = await apiRequest("PATCH", plansPath(subdomain, `${planId}/`), {
    body: input,
    fallbackError: "Could not save that plan.",
  });
  return (await response.json()) as Plan;
}

/**
 * Delete a plan nobody was ever subscribed to.
 *
 * @throws {ApiError} If members have been subscribed (archive it instead).
 */
export async function deletePlan(subdomain: string, planId: number): Promise<void> {
  await apiRequest("DELETE", plansPath(subdomain, `${planId}/`), { fallbackError: "Could not delete that plan." });
}

/**
 * The request path for a page of the academy's plan subscriptions.
 *
 * @param subdomain - The academy's subdomain.
 * @param filters - Status, plan, and member-search filters.
 * @returns A "/api/..." path including only the non-empty filters.
 */
export function buildSubscribersPath(subdomain: string, filters: SubscriberFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return `/api/academies/${subdomain}/subscriptions/${query ? `?${query}` : ""}`;
}

/**
 * Load a page of plan subscriptions.
 *
 * @param target - A path from `buildSubscribersPath`, or a full `next`/`previous` URL from a previous page.
 * @throws {ApiError} If the request fails.
 */
export async function listSubscribers(target: string): Promise<SubscriberList> {
  const path = target.startsWith("http") ? pathFromUrl(target) : target;
  const response = await apiRequest("GET", path, { fallbackError: "Could not load subscribers." });
  return (await response.json()) as SubscriberList;
}

/**
 * Subscribe several members to one plan; anyone already on it is skipped.
 *
 * @returns The new subscriptions and how many members were skipped.
 * @throws {ApiError} If the plan is archived or a member isn't an active member here.
 */
export async function assignPlan(
  subdomain: string,
  input: AssignPlanInput,
): Promise<{ created: Subscription[]; skipped: number }> {
  const response = await apiRequest("POST", `/api/academies/${subdomain}/subscriptions/assign/`, {
    body: input,
    fallbackError: "Could not assign that plan.",
  });
  return (await response.json()) as { created: Subscription[]; skipped: number };
}

/**
 * End a member's plan subscription (its history and payments are kept).
 *
 * @throws {ApiError} If the request fails.
 */
export async function endSubscription(subdomain: string, subscriptionId: number): Promise<Subscription> {
  const response = await apiRequest("POST", `/api/academies/${subdomain}/subscriptions/${subscriptionId}/end/`, {
    fallbackError: "Could not end that subscription.",
  });
  return (await response.json()) as Subscription;
}

/** The payments endpoint of one of the academy's plan subscriptions, for `createPaymentsClient`. */
export function subscriptionPaymentsPath(subdomain: string, subscriptionId: number): string {
  return `/api/academies/${subdomain}/subscriptions/${subscriptionId}/payments/`;
}
