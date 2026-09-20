/** Loads the academies that charge a platform fee - the options for the Fees table's academy filter. */

import { useEffect, useState } from "react";

import type { AdminAcademy } from "../api/adminAcademiesApi";
import { buildAcademiesUrl, listAcademies } from "../api/adminAcademiesApi";
import { logger } from "../utils/logger";

const ACADEMY_PAGE_LIMIT = "200";

/**
 * Fetch every academy that has a monthly and/or yearly platform fee set.
 *
 * @returns Those academies, by name; empty until loaded (or if loading fails).
 */
export function useFeeAcademies(): AdminAcademy[] {
  const [academies, setAcademies] = useState<AdminAcademy[]>([]);

  useEffect(() => {
    let cancelled = false;
    listAcademies(buildAcademiesUrl({ ordering: "name", limit: ACADEMY_PAGE_LIMIT }))
      .then((page) => {
        if (cancelled) return;
        setAcademies(page.results.filter((academy) => academy.platform_fee_monthly || academy.platform_fee_yearly));
      })
      .catch((error: unknown) => {
        logger.error("Failed to load academies for the fees filter", {
          error: error instanceof Error ? error.message : error,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return academies;
}
