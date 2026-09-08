/** API layer for an academy manager viewing/editing their own academy's profile. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** An academy's full details, as seen by its own manager. */
export interface ManagerAcademyProfile {
  id: number;
  name: string;
  subdomain: string;
  address: string;
  google_maps_url: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  logo: string | null;
  legal_document: string | null;
  login_background_video: string | null;
  is_active: boolean;
  created_at: string;
}

export type ManagerAcademyUpdate = Partial<
  Pick<ManagerAcademyProfile, "contact_email" | "contact_phone" | "address" | "google_maps_url" | "description">
>;

export class ManagerAcademyError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new ManagerAcademyError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

/**
 * Fetch the current academy's full profile (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @returns The academy's details.
 * @throws {ManagerAcademyError} If the request fails (including not being that academy's manager).
 */
export async function fetchMyAcademyProfile(subdomain: string): Promise<ManagerAcademyProfile> {
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/profile/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new ManagerAcademyError("Could not load the academy profile.");
  }
  return (await response.json()) as ManagerAcademyProfile;
}

/**
 * Update the current academy's contact/description fields (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param data - Any subset of the editable fields.
 * @returns The updated academy profile.
 * @throws {ManagerAcademyError} If the request is invalid or fails.
 */
export async function updateMyAcademyProfile(
  subdomain: string,
  data: ManagerAcademyUpdate,
): Promise<ManagerAcademyProfile> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/profile/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new ManagerAcademyError("Could not save the academy profile.");
  }
  return (await response.json()) as ManagerAcademyProfile;
}
