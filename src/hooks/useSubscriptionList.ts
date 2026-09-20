/** Loads one page of a paginated subscription list (an academy's plan subscribers, or the super admin's fees). */

import { useEffect, useState } from "react";

import type { SubscriberList } from "../api/academySubscriptionApi";
import { listSubscribers } from "../api/academySubscriptionApi";
import { logger } from "../utils/logger";

interface Snapshot {
  target: string;
  version: number;
  result: { page: SubscriberList } | { error: string };
}

interface PageOverride {
  /** The first-page path (which encodes the filters) that this paged link belongs to. */
  firstPath: string;
  url: string;
}

export interface SubscriptionListView {
  page: SubscriberList | null;
  isLoading: boolean;
  error: string | null;
  /** Follow a `next`/`previous` link from the current page. */
  goTo: (url: string | null) => void;
  reload: () => void;
}

/**
 * Fetch a page of subscriptions.
 *
 * The last loaded page stays visible while the next one loads, so the table doesn't flash empty.
 * Changing the filters (and so `firstPath`) starts again from page one.
 *
 * @param firstPath - The request path for page one with the current filters already applied.
 * @returns The current page, loading/error state, and paging/reload helpers.
 */
export function useSubscriptionList(firstPath: string): SubscriptionListView {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [override, setOverride] = useState<PageOverride | null>(null);
  const [version, setVersion] = useState(0);

  const target = override && override.firstPath === firstPath ? override.url : firstPath;

  useEffect(() => {
    let cancelled = false;
    listSubscribers(target)
      .then((page) => {
        if (!cancelled) setSnapshot({ target, version, result: { page } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load subscriptions.";
        logger.error("Failed to load subscriptions", { error: message });
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
    goTo: (url) => url && setOverride({ firstPath, url }),
    reload: () => setVersion((value) => value + 1),
  };
}
