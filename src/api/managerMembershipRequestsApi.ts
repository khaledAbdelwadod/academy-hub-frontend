/** API layer for an academy manager reviewing pending join requests. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** One of the academy's configured questions, paired with this applicant's answer. */
export interface JoinRequestAnswerEntry {
  field_id: number;
  label: string;
  answer: string;
}

/** A pending join request: the applicant's account details plus their form answers. */
export interface ManagerMembershipRequestRow {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  role: string;
  joined_at: string;
  answers: JoinRequestAnswerEntry[];
}

export interface ManagerMembershipRequestList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ManagerMembershipRequestRow[];
}

export class ManagerMembershipRequestsError extends Error {}

/**
 * Build the membership-requests-list URL for a given academy and optional name search.
 *
 * @param subdomain - The academy's subdomain.
 * @param name - Optional search text (matches the applicant's first or last name).
 * @returns The full request URL.
 */
export function buildMembershipRequestsUrl(subdomain: string, name?: string): string {
  const params = new URLSearchParams();
  if (name) {
    params.set("name", name);
  }
  const queryString = params.toString();
  return `${API_BASE_URL}/api/academies/${subdomain}/membership-requests/${queryString ? `?${queryString}` : ""}`;
}

/**
 * List an academy's pending join requests (paginated), for that academy's manager.
 *
 * @param url - Optional full URL (from a previous response's `next`/`previous`, or `buildMembershipRequestsUrl`).
 * @param subdomain - The academy's subdomain, required if `url` is omitted.
 * @returns A page of pending requests, each with its applicant's form answers.
 * @throws {ManagerMembershipRequestsError} If the request fails.
 */
export async function listMembershipRequests(
  url?: string,
  subdomain?: string,
): Promise<ManagerMembershipRequestList> {
  const target = url ?? (subdomain ? buildMembershipRequestsUrl(subdomain) : undefined);
  if (!target) {
    throw new ManagerMembershipRequestsError("No academy specified.");
  }
  const response = await fetch(target, { credentials: "include" });
  if (!response.ok) {
    throw new ManagerMembershipRequestsError("Could not load membership requests.");
  }
  return (await response.json()) as ManagerMembershipRequestList;
}
