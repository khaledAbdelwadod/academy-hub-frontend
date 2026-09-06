/** API layer for the backend's health-check endpoint. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

export interface HealthStatus {
  status: string;
}

/**
 * Call the backend health-check endpoint.
 *
 * @returns The parsed health status payload.
 * @throws {Error} If the request fails or the response is not ok.
 */
export async function fetchHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/health/`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as HealthStatus;
}
