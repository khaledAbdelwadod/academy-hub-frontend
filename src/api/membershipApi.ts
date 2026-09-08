/** API layer for a signed-in user checking their own membership status at an academy. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

export interface MyMembership {
  is_member: boolean;
  academy_name: string;
  academy_contact_phone: string;
}

export class MembershipError extends Error {}

/**
 * Check whether the signed-in user has an active membership at an academy.
 *
 * @param subdomain - The academy's subdomain (e.g. "football-heros").
 * @returns Membership status plus the academy's name/contact phone.
 * @throws {MembershipError} If there's no active academy with that subdomain, or the request fails.
 */
export async function fetchMyMembership(subdomain: string): Promise<MyMembership> {
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/membership/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new MembershipError("Could not check your membership at that academy.");
  }
  return (await response.json()) as MyMembership;
}
