/** API layer for superadmin user-management endpoints. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** Every User column, as returned to a superadmin managing accounts. */
export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  avatar: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AdminUserList {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUser[];
}

export interface AdminUserCreate {
  email: string;
  password: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export type AdminUserUpdate = Partial<
  Pick<
    AdminUser,
    | "first_name"
    | "middle_name"
    | "last_name"
    | "email"
    | "phone"
    | "date_of_birth"
    | "is_active"
    | "is_staff"
    | "is_superuser"
  >
>;

export class AdminUsersError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new AdminUsersError("Could not reach Academy Hub. Check your connection and try again.");
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
  return fallback;
}

/**
 * List every user account (paginated).
 *
 * @param url - Optional full URL (from a previous response's `next`/`previous`) to page through results.
 * @returns A page of users.
 * @throws {AdminUsersError} If the request fails.
 */
export async function listUsers(url?: string): Promise<AdminUserList> {
  const response = await fetch(url ?? `${API_BASE_URL}/api/admin/users/`, { credentials: "include" });
  if (!response.ok) {
    throw new AdminUsersError("Could not load users.");
  }
  return (await response.json()) as AdminUserList;
}

/**
 * Create a new user account directly.
 *
 * @param data - The new account's fields, including an initial password.
 * @returns The created user.
 * @throws {AdminUsersError} If the request is invalid or fails.
 */
export async function createUser(data: AdminUserCreate): Promise<AdminUser> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/users/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new AdminUsersError(await readErrorDetail(response, "Could not create that user."));
  }
  return (await response.json()) as AdminUser;
}

/**
 * Update another user's account fields.
 *
 * @param id - The target user's id.
 * @param data - Any subset of the editable fields.
 * @returns The updated user.
 * @throws {AdminUsersError} If the request is invalid (including the self-protection guard) or fails.
 */
export async function updateUser(id: number, data: AdminUserUpdate): Promise<AdminUser> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new AdminUsersError(await readErrorDetail(response, "Could not save that user."));
  }
  return (await response.json()) as AdminUser;
}

/**
 * Permanently delete a user account (their academy memberships are removed first).
 *
 * @param id - The target user's id.
 * @throws {AdminUsersError} If the request is invalid (including the self-protection guard) or fails.
 */
export async function deleteUser(id: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new AdminUsersError(await readErrorDetail(response, "Could not delete that user."));
  }
}
