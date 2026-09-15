/** API layer for an academy's join-request form: the manager's field builder, and public submission. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** One question on an academy's join-request form. */
export interface JoinRequestField {
  id: number;
  label: string;
  required: boolean;
  order: number;
}

export type JoinRequestFieldInput = Partial<Pick<JoinRequestField, "label" | "required" | "order">>;

export class JoinRequestError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new JoinRequestError("Could not reach Academy Hub. Check your connection and try again.");
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
 * List an academy's join-request form fields, in display order.
 *
 * Readable by any signed-in user (a prospective member needs to see the questions), not
 * just that academy's manager.
 *
 * @param subdomain - The academy's subdomain.
 * @returns The configured fields, or an empty array if the manager hasn't set up a form.
 * @throws {JoinRequestError} If the request fails.
 */
export async function listJoinRequestFields(subdomain: string): Promise<JoinRequestField[]> {
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/join-request-fields/`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new JoinRequestError("Could not load the join-request form.");
  }
  const data = (await response.json()) as JoinRequestField[] | { results: JoinRequestField[] };
  return Array.isArray(data) ? data : data.results;
}

/**
 * Add a new field to the academy's join-request form (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param data - The field's label, required flag, and display order.
 * @returns The created field.
 * @throws {JoinRequestError} If the request is invalid or fails.
 */
export async function createJoinRequestField(
  subdomain: string,
  data: { label: string; required: boolean; order: number },
): Promise<JoinRequestField> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/join-request-fields/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new JoinRequestError(await readErrorDetail(response, "Could not add that field."));
  }
  return (await response.json()) as JoinRequestField;
}

/**
 * Edit a join-request field's label, required flag, and/or order (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param fieldId - The field's id.
 * @param data - Any subset of the editable properties.
 * @returns The updated field.
 * @throws {JoinRequestError} If the request is invalid or fails.
 */
export async function updateJoinRequestField(
  subdomain: string,
  fieldId: number,
  data: JoinRequestFieldInput,
): Promise<JoinRequestField> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/join-request-fields/${fieldId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new JoinRequestError(await readErrorDetail(response, "Could not save that field."));
  }
  return (await response.json()) as JoinRequestField;
}

/**
 * Remove a field from the academy's join-request form (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param fieldId - The field's id.
 * @throws {JoinRequestError} If the request fails.
 */
export async function deleteJoinRequestField(subdomain: string, fieldId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/join-request-fields/${fieldId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new JoinRequestError(await readErrorDetail(response, "Could not remove that field."));
  }
}

/**
 * Submit a filled-in join-request form for the current (signed-in, non-member) user.
 *
 * @param subdomain - The academy's subdomain.
 * @param answers - Each answered field's id (as a string) mapped to the given text.
 * @throws {JoinRequestError} If a required field was left blank or the request fails.
 */
export async function submitJoinRequest(subdomain: string, answers: Record<string, string>): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/join-request/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    throw new JoinRequestError(await readErrorDetail(response, "Could not submit your request."));
  }
}
