/** Shows whether the frontend can reach the backend's health-check endpoint. */

import type { ReactElement } from "react";

import { useHealthCheck } from "../hooks/useHealthCheck";

export function HealthStatus(): ReactElement {
  const health = useHealthCheck();

  if (health.state === "loading") {
    return <p className="text-slate-500">Checking backend connection…</p>;
  }

  if (health.state === "error") {
    return <p className="text-red-600">Backend unreachable: {health.message}</p>;
  }

  return <p className="text-green-600">Backend says: {health.status}</p>;
}
