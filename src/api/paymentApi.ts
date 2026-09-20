/** Payments recorded by hand against a subscription - shared by the academy manager's and the super admin's screens. */

import { apiRequest } from "./apiClient";
import type { Subscription } from "./subscriptionApi";

/** One recorded payment and the period it covers (both ends inclusive; no end for a one-time plan). */
export interface Payment {
  id: number;
  amount: string;
  paid_on: string;
  period_start: string;
  period_end: string | null;
  recorded_by_name: string;
  note: string;
  created_at: string;
}

/** Every field is optional: the server defaults the amount to the price, the day to today, and the period to the next one. */
export interface PaymentInput {
  amount?: string;
  paid_on?: string;
  period_start?: string;
  note?: string;
}

export interface PaymentsClient {
  list: () => Promise<Payment[]>;
  /** Record a payment; resolves with it and the subscription's new status. */
  record: (input: PaymentInput) => Promise<{ payment: Payment; subscription: Subscription }>;
  /** Remove a wrongly recorded payment; resolves with the subscription's re-derived status. */
  remove: (paymentId: number) => Promise<Subscription>;
}

/**
 * Build a client for one subscription's payments.
 *
 * @param basePath - The payments endpoint with a trailing slash, e.g.
 *   "/api/academies/{subdomain}/subscriptions/{id}/payments/".
 * @returns Functions to list, record, and remove that subscription's payments.
 */
export function createPaymentsClient(basePath: string): PaymentsClient {
  return {
    async list() {
      const response = await apiRequest("GET", basePath, { fallbackError: "Could not load the payments." });
      return (await response.json()) as Payment[];
    },
    async record(input) {
      const response = await apiRequest("POST", basePath, {
        body: input,
        fallbackError: "Could not record that payment.",
      });
      return (await response.json()) as { payment: Payment; subscription: Subscription };
    },
    async remove(paymentId) {
      const response = await apiRequest("DELETE", `${basePath}${paymentId}/`, {
        fallbackError: "Could not remove that payment.",
      });
      return (await response.json()) as Subscription;
    },
  };
}
