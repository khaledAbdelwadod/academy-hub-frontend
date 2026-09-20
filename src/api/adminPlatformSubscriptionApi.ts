/** API layer for the super admin tracking every player's platform-fee subscription across academies. */

import { apiRequest } from "./apiClient";
import type { PlatformCycle, Subscription } from "./subscriptionApi";

/** Filters for the fees table; empty values are left out of the request. */
export interface FeeFilters {
  status: string;
  /** An academy's id as text, or "" for all academies. */
  academy: string;
  /** Matches the player's name or email. */
  q: string;
}

const BASE_PATH = "/api/admin/platform-subscriptions/";

/**
 * The request path for a page of platform subscriptions.
 *
 * @param filters - Status, academy, and player-search filters.
 * @returns A "/api/..." path including only the non-empty filters; load it with `listSubscribers`.
 */
export function buildFeesPath(filters: FeeFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return `${BASE_PATH}${query ? `?${query}` : ""}`;
}

/**
 * Change a player's billing cycle - unlike the player, the super admin may do so after payments exist.
 *
 * @param subscriptionId - The platform subscription's id.
 * @param cycle - "monthly" or "yearly".
 * @returns The updated subscription (the new price applies to the next payment).
 * @throws {ApiError} If the academy doesn't offer that cycle.
 */
export async function changePlatformCycle(subscriptionId: number, cycle: PlatformCycle): Promise<Subscription> {
  const response = await apiRequest("PATCH", `${BASE_PATH}${subscriptionId}/`, {
    body: { cycle },
    fallbackError: "Could not change the billing cycle.",
  });
  return (await response.json()) as Subscription;
}

/** The payments endpoint of one platform subscription, for `createPaymentsClient`. */
export function platformPaymentsPath(subscriptionId: number): string {
  return `${BASE_PATH}${subscriptionId}/payments/`;
}
