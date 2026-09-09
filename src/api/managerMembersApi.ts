/** API layer for an academy manager viewing/managing their own academy's (non-manager) members. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

export type MemberRole = "admin" | "coach" | "player";
export type MemberStatus = "invited" | "requested" | "active" | "suspended";

/** One member of the manager's academy - account details plus their role/status. */
export interface ManagerMemberRow {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export interface ManagerMemberList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ManagerMemberRow[];
}

/** Per-column search values and sort order for the members list; empty/undefined values are omitted. */
export interface ManagerMemberListQuery {
  name?: string;
  role?: string;
  status?: string;
  ordering?: string;
}

/** A minimal, registered-user search result, for picking someone to add as a member. */
export interface ManagerUserSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export class ManagerMembersError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new ManagerMembersError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.join(" ");
  }
  if (body && typeof body === "object" && "role" in body) {
    const roleError = (body as { role: unknown }).role;
    if (Array.isArray(roleError) && typeof roleError[0] === "string") return roleError[0];
  }
  return fallback;
}

/**
 * Build the members-list URL for a given academy and set of column filters/sort.
 *
 * @param subdomain - The academy's subdomain.
 * @param query - Per-column filter values and/or an ordering field.
 * @returns The full request URL, with only the non-empty query params included.
 */
export function buildMembersUrl(subdomain: string, query: ManagerMemberListQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const queryString = params.toString();
  return `${API_BASE_URL}/api/academies/${subdomain}/members/${queryString ? `?${queryString}` : ""}`;
}

/**
 * List an academy's own (non-manager) members (paginated), for that academy's manager.
 *
 * @param url - Optional full URL (from a previous response's `next`/`previous`, or `buildMembersUrl`).
 * @param subdomain - The academy's subdomain, required if `url` is omitted.
 * @returns A page of member rows.
 * @throws {ManagerMembersError} If the request fails.
 */
export async function listMembers(url?: string, subdomain?: string): Promise<ManagerMemberList> {
  const target = url ?? (subdomain ? buildMembersUrl(subdomain, {}) : undefined);
  if (!target) {
    throw new ManagerMembersError("No academy specified.");
  }
  const response = await fetch(target, { credentials: "include" });
  if (!response.ok) {
    throw new ManagerMembersError("Could not load members.");
  }
  return (await response.json()) as ManagerMemberList;
}

/**
 * Search registered users by email or phone, to pick one to add as a member.
 *
 * @param subdomain - The academy's subdomain.
 * @param q - The search term (email or phone, partial match).
 * @returns Matching users.
 * @throws {ManagerMembersError} If the request fails.
 */
export async function searchUsersToAdd(subdomain: string, q: string): Promise<ManagerUserSearchResult[]> {
  const params = new URLSearchParams({ q });
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/members/search/?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new ManagerMembersError("Search failed.");
  }
  const data = (await response.json()) as ManagerUserSearchResult[] | { results: ManagerUserSearchResult[] };
  return Array.isArray(data) ? data : data.results;
}

/**
 * Add an existing user as an active member of the academy.
 *
 * @param subdomain - The academy's subdomain.
 * @param userId - The user to add.
 * @param role - The role to add them as (admin, coach, or player).
 * @returns The new (or reactivated) member row.
 * @throws {ManagerMembersError} If the request is invalid or fails.
 */
export async function addMember(subdomain: string, userId: number, role: MemberRole): Promise<ManagerMemberRow> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/members/add/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ user_id: userId, role }),
  });
  if (!response.ok) {
    throw new ManagerMembersError(await readErrorDetail(response, "Could not add that member."));
  }
  return (await response.json()) as ManagerMemberRow;
}

/**
 * Change a member's role and/or status.
 *
 * @param subdomain - The academy's subdomain.
 * @param membershipId - The membership row's id.
 * @param data - The role and/or status to change.
 * @returns The updated member row.
 * @throws {ManagerMembersError} If the request is invalid or fails.
 */
export async function updateMember(
  subdomain: string,
  membershipId: number,
  data: Partial<Pick<ManagerMemberRow, "role" | "status">>,
): Promise<ManagerMemberRow> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/members/${membershipId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new ManagerMembersError(await readErrorDetail(response, "Could not save that member."));
  }
  return (await response.json()) as ManagerMemberRow;
}

/**
 * Remove a member from the academy.
 *
 * @param subdomain - The academy's subdomain.
 * @param membershipId - The membership row's id.
 * @throws {ManagerMembersError} If the request fails.
 */
export async function removeMember(subdomain: string, membershipId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/members/${membershipId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new ManagerMembersError(await readErrorDetail(response, "Could not remove that member."));
  }
}
