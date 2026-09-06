/** Fetches and tracks the backend health status once on mount. */

import { useEffect, useState } from "react";

import { fetchHealthStatus } from "../api/healthApi";
import { logger } from "../utils/logger";

type HealthCheckState =
  | { state: "loading" }
  | { state: "ok"; status: string }
  | { state: "error"; message: string };

/**
 * Fetch the backend health status once on mount.
 *
 * @returns The current health-check state (loading, ok, or error).
 */
export function useHealthCheck(): HealthCheckState {
  const [result, setResult] = useState<HealthCheckState>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchHealthStatus()
      .then((data) => {
        if (!cancelled) {
          logger.info("Backend health check succeeded", { status: data.status });
          setResult({ state: "ok", status: data.status });
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (!cancelled) {
          logger.error("Backend health check failed", { error: message });
          setResult({ state: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
