/** Loads the signed-in member's own subscriptions at the academy they're visiting. */

import { useEffect, useState } from "react";

import type { MySubscriptions } from "../api/subscriptionApi";
import { fetchMySubscriptions } from "../api/subscriptionApi";
import { logger } from "../utils/logger";

export type MySubscriptionsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MySubscriptions };

interface Snapshot {
  subdomain: string;
  result: { data: MySubscriptions } | { error: string };
}

/**
 * Fetch the member's subscriptions (status, platform fee summary, blocked flag).
 *
 * While a `reload` is in flight the previous data stays in place, so a card doesn't blink
 * empty after the member changes something.
 *
 * @param subdomain - The academy's subdomain, or null to stay idle (not a member, www, ...).
 * @returns The load state, and a `reload` to fetch again after a change.
 */
export function useMySubscriptions(subdomain: string | null): {
  state: MySubscriptionsState;
  reload: () => void;
} {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!subdomain) return;
    let cancelled = false;

    fetchMySubscriptions(subdomain)
      .then((data) => {
        if (!cancelled) setSnapshot({ subdomain, result: { data } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load your subscriptions.";
        logger.error("Failed to load subscriptions", { error: message });
        setSnapshot({ subdomain, result: { error: message } });
      });

    return () => {
      cancelled = true;
    };
  }, [subdomain, version]);

  const reload = (): void => setVersion((value) => value + 1);

  if (!subdomain) return { state: { status: "idle" }, reload };
  if (!snapshot || snapshot.subdomain !== subdomain) return { state: { status: "loading" }, reload };
  const { result } = snapshot;
  if ("data" in result) return { state: { status: "ready", data: result.data }, reload };
  return { state: { status: "error", message: result.error }, reload };
}
