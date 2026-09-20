/** Shared request plumbing (base URL, CSRF, error text) for the API modules that use JSON over the session cookie. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A failed API call, carrying a message that is safe to show the user. */
export class ApiError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new ApiError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/**
 * Pull a human-readable message out of a DRF error body: its `detail`, else the first
 * message of any field error.
 */
async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (!body || typeof body !== "object") return fallback;

  const fields = body as Record<string, unknown>;
  const detail = firstMessage(fields.detail);
  if (detail) return detail;
  for (const value of Object.values(fields)) {
    const message = firstMessage(value);
    if (message) return message;
  }
  return fallback;
}

/**
 * The path-and-query part of an absolute API URL, such as a paginated response's `next` link.
 *
 * Only the path is kept, so the request goes to this app's configured API host even if the
 * server built the link with a different scheme or host.
 */
export function pathFromUrl(url: string): string {
  const parsed = new URL(url, API_BASE_URL);
  return `${parsed.pathname}${parsed.search}`;
}

interface RequestOptions {
  /** JSON-serialisable request body. */
  body?: unknown;
  /** Shown when the server gives no usable error message. */
  fallbackError: string;
}

/**
 * Call the Academy Hub API with the session cookie (and a CSRF token for anything but GET).
 *
 * @param method - The HTTP method.
 * @param path - The path after the API host, starting with "/api/".
 * @param options - Optional JSON body and the fallback error text.
 * @returns The successful response.
 * @throws {ApiError} If the request fails or the server rejects it.
 */
export async function apiRequest(method: HttpMethod, path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (method !== "GET") {
    headers["X-CSRFToken"] = await fetchCsrfToken();
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorDetail(response, options.fallbackError));
  }
  return response;
}
