/** Loads the academy's subscription plans (both tabs of the Subscriptions page need them). */

import { useEffect, useState } from "react";

import type { Plan } from "../api/academySubscriptionApi";
import { listPlans } from "../api/academySubscriptionApi";
import { logger } from "../utils/logger";

export type PlansState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; plans: Plan[] };

interface Snapshot {
  subdomain: string;
  result: { plans: Plan[] } | { error: string };
}

/**
 * Fetch the academy's plans, archived ones included.
 *
 * Previous plans stay on screen while `reload` is in flight, so tables don't blink empty.
 *
 * @param subdomain - The academy's subdomain.
 * @returns The load state and a `reload` to call after plans change.
 */
export function usePlans(subdomain: string): { state: PlansState; reload: () => void } {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listPlans(subdomain)
      .then((plans) => {
        if (!cancelled) setSnapshot({ subdomain, result: { plans } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load plans.";
        logger.error("Failed to load plans", { error: message });
        setSnapshot({ subdomain, result: { error: message } });
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain, version]);

  const reload = (): void => setVersion((value) => value + 1);
  if (!snapshot || snapshot.subdomain !== subdomain) return { state: { status: "loading" }, reload };
  const { result } = snapshot;
  if ("plans" in result) return { state: { status: "ready", plans: result.plans }, reload };
  return { state: { status: "error", message: result.error }, reload };
}
