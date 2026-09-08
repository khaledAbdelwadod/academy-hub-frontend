/** API layer for a signed-in user's own memberships - not the superadmin admin endpoints. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

export interface MyMembership {
  is_member: boolean;
  academy_name: string;
  academy_logo: string | null;
  academy_contact_phone: string;
}

/** One academy the signed-in user has an active membership at - a picker card's data. */
export interface MyAcademy {
  name: string;
  subdomain: string;
  logo: string | null;
  login_background_video: string | null;
}

export class MembershipError extends Error {}

/**
 * Check whether the signed-in user has an active membership at an academy.
 *
 * @param subdomain - The academy's subdomain (e.g. "football-heros").
 * @returns Membership status plus the academy's name/logo/contact phone.
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

/**
 * List every academy the signed-in user has an active membership at (any role).
 *
 * @returns The academies to show as picker cards on www.academy-hub.net.
 * @throws {MembershipError} If the request fails.
 */
export async function fetchMyAcademies(): Promise<MyAcademy[]> {
  const response = await fetch(`${API_BASE_URL}/api/academies/mine/`, { credentials: "include" });
  if (!response.ok) {
    throw new MembershipError("Could not load your academies.");
  }
  return (await response.json()) as MyAcademy[];
}
