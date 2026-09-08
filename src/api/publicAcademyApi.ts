/** API layer for the public, unauthenticated academy-branding lookup. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** The subset of an academy's fields shown on its own login page before anyone logs in. */
export interface PublicAcademyBranding {
  name: string;
  logo: string | null;
  login_background_video: string | null;
}

export class PublicAcademyError extends Error {}

/**
 * Look up an active academy's login-page branding by its subdomain.
 *
 * @param subdomain - The academy's subdomain (e.g. "football-heros").
 * @returns The academy's name, logo, and login background video.
 * @throws {PublicAcademyError} If no active academy has that subdomain.
 */
export async function fetchAcademyBranding(subdomain: string): Promise<PublicAcademyBranding> {
  const response = await fetch(`${API_BASE_URL}/api/public/academies/${subdomain}/`);
  if (!response.ok) {
    throw new PublicAcademyError("No active academy found for that subdomain.");
  }
  return (await response.json()) as PublicAcademyBranding;
}
