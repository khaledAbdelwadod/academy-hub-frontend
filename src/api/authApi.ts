/** API layer for authentication endpoints. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  is_superuser: boolean;
}

export class AuthError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Hits the CSRF bootstrap endpoint and returns the token it sets. */
async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new AuthError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

/**
 * Sign in with email and password.
 *
 * @param email - The account's email address.
 * @param password - The account's password.
 * @returns The signed-in user's public profile fields.
 * @throws {AuthError} If the credentials are invalid, the request is rate-limited, or the
 *   network/backend is unreachable.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const csrfToken = await fetchCsrfToken();

  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 429) {
    throw new AuthError("Too many attempts. Try again in a minute.");
  }
  if (!response.ok) {
    throw new AuthError("Invalid email or password.");
  }

  return (await response.json()) as AuthUser;
}
