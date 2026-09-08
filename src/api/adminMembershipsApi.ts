/** API layer for the superadmin Memberships table (one row per academy). */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** One academy's manager and active-member counts by role. */
export interface AdminMembershipRow {
  id: number;
  name: string;
  subdomain: string;
  manager_email: string | null;
  admins_count: number;
  coaches_count: number;
  players_count: number;
}

export interface AdminMembershipList {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminMembershipRow[];
}

/** Per-column search values and sort order for the memberships list. */
export interface AdminMembershipListQuery {
  name?: string;
  ordering?: string;
}

export class AdminMembershipsError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new AdminMembershipsError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

/**
 * Build the /api/admin/memberships/ URL for a given set of column filters/sort.
 *
 * @param query - Per-column filter values and/or an ordering field.
 * @returns The full request URL, with only the non-empty query params included.
 */
export function buildMembershipsUrl(query: AdminMembershipListQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const queryString = params.toString();
  return `${API_BASE_URL}/api/admin/memberships/${queryString ? `?${queryString}` : ""}`;
}

/**
 * List every academy with its manager and active-member counts (paginated).
 *
 * @param url - Optional full URL (from a previous response's `next`/`previous`, or `buildMembershipsUrl`).
 * @returns A page of academy membership rows.
 * @throws {AdminMembershipsError} If the request fails.
 */
export async function listMemberships(url?: string): Promise<AdminMembershipList> {
  const response = await fetch(url ?? `${API_BASE_URL}/api/admin/memberships/`, { credentials: "include" });
  if (!response.ok) {
    throw new AdminMembershipsError("Could not load memberships.");
  }
  return (await response.json()) as AdminMembershipList;
}

/**
 * Assign (or replace) an academy's manager.
 *
 * @param academyId - The target academy's id.
 * @param userId - The user to make manager.
 * @returns The academy's updated membership row.
 * @throws {AdminMembershipsError} If the user doesn't exist or the request fails.
 */
export async function assignManager(academyId: number, userId: number): Promise<AdminMembershipRow> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/memberships/${academyId}/assign-manager/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) {
    throw new AdminMembershipsError("Could not assign that manager.");
  }
  return (await response.json()) as AdminMembershipRow;
}
