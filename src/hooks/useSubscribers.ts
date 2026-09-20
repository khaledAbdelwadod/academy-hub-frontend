/** Loads one page of the academy's plan subscriptions for the current filters, with paging and reload. */

import { useEffect, useState } from "react";

import type { SubscriberFilters, SubscriberList } from "../api/academySubscriptionApi";
import { buildSubscribersPath, listSubscribers } from "../api/academySubscriptionApi";
import { logger } from "../utils/logger";

interface Snapshot {
  target: string;
  version: number;
  result: { page: SubscriberList } | { error: string };
}

interface PageOverride {
  /** The filters the paged link belongs to; a link is only followed while they're unchanged. */
  filtersKey: string;
  url: string;
}

export interface SubscribersView {
  page: SubscriberList | null;
  isLoading: boolean;
  error: string | null;
  /** Follow a `next`/`previous` link from the current page. */
  goTo: (url: string | null) => void;
  reload: () => void;
}

/**
 * Fetch the plan subscriptions matching `filters` (already debounced by the caller).
 *
 * The last loaded page stays visible while the next one loads, so the table doesn't flash empty.
 *
 * @param subdomain - The academy's subdomain.
 * @param filters - Status, plan, and member-search filters.
 * @returns The current page, loading/error state, and paging/reload helpers.
 */
export function useSubscribers(subdomain: string, filters: SubscriberFilters): SubscribersView {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [override, setOverride] = useState<PageOverride | null>(null);
  const [version, setVersion] = useState(0);

  const filtersKey = JSON.stringify(filters);
  const target = override && override.filtersKey === filtersKey ? override.url : buildSubscribersPath(subdomain, filters);

  useEffect(() => {
    let cancelled = false;
    listSubscribers(target)
      .then((page) => {
        if (!cancelled) setSnapshot({ target, version, result: { page } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load subscribers.";
        logger.error("Failed to load subscribers", { error: message });
        setSnapshot({ target, version, result: { error: message } });
      });
    return () => {
      cancelled = true;
    };
  }, [target, version]);

  const isCurrent = snapshot?.target === target && snapshot.version === version;
  const result = snapshot?.result;
  return {
    page: result && "page" in result ? result.page : null,
    isLoading: !isCurrent,
    error: isCurrent && result && "error" in result ? result.error : null,
    goTo: (url) => url && setOverride({ filtersKey, url }),
    reload: () => setVersion((value) => value + 1),
  };
}
