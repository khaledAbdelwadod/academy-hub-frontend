/** Detects which academy's subdomain (if any) the app is currently running on. */

const BASE_DOMAIN = "academy-hub.net";

/**
 * Read the academy subdomain from the current hostname.
 *
 * @returns The subdomain label (e.g. "football-heros"), or null if the app is
 * running on the bare domain, "www", or any other host (e.g. local dev).
 */
export function getAcademySubdomain(): string | null {
  const host = window.location.hostname;
  if (host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`) {
    return null;
  }
  if (!host.endsWith(`.${BASE_DOMAIN}`)) {
    return null;
  }
  const label = host.slice(0, -(`.${BASE_DOMAIN}`.length));
  return label.includes(".") ? null : label;
}
