/** API layer for superadmin academy-management endpoints. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** Every Academy column, as returned to a superadmin managing academies. */
export interface AdminAcademy {
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

export interface AdminAcademyList {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminAcademy[];
}

export interface AdminAcademyCreate {
  name: string;
  subdomain: string;
  address?: string;
  google_maps_url?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: boolean;
}

export type AdminAcademyUpdate = Partial<
  Pick<
    AdminAcademy,
    | "name"
    | "address"
    | "google_maps_url"
    | "description"
    | "contact_email"
    | "contact_phone"
    | "is_active"
  >
>;

/** Per-column search values and sort order for the academy list. */
export interface AdminAcademyListQuery {
  name?: string;
  subdomain?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active?: string;
  ordering?: string;
}

export class AdminAcademiesError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new AdminAcademiesError("Could not reach Academy Hub. Check your connection and try again.");
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
 * Build the /api/admin/academies/ URL for a given set of column filters/sort.
 *
 * @param query - Per-column filter values and/or an ordering field.
 * @returns The full request URL, with only the non-empty query params included.
 */
export function buildAcademiesUrl(query: AdminAcademyListQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const queryString = params.toString();
  return `${API_BASE_URL}/api/admin/academies/${queryString ? `?${queryString}` : ""}`;
}

/**
 * List every academy (paginated).
 *
 * @param url - Optional full URL (from a previous response's `next`/`previous`, or `buildAcademiesUrl`).
 * @returns A page of academies.
 * @throws {AdminAcademiesError} If the request fails.
 */
export async function listAcademies(url?: string): Promise<AdminAcademyList> {
  const response = await fetch(url ?? `${API_BASE_URL}/api/admin/academies/`, { credentials: "include" });
  if (!response.ok) {
    throw new AdminAcademiesError("Could not load academies.");
  }
  return (await response.json()) as AdminAcademyList;
}

/**
 * Create a new academy.
 *
 * @param data - The new academy's fields, including its (permanent) subdomain.
 * @returns The created academy.
 * @throws {AdminAcademiesError} If the request is invalid (e.g. subdomain taken) or fails.
 */
export async function createAcademy(data: AdminAcademyCreate): Promise<AdminAcademy> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/academies/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new AdminAcademiesError(await readErrorDetail(response, "Could not create that academy."));
  }
  return (await response.json()) as AdminAcademy;
}

/**
 * Update an academy's editable fields (not its subdomain or files).
 *
 * @param id - The target academy's id.
 * @param data - Any subset of the editable fields.
 * @returns The updated academy.
 * @throws {AdminAcademiesError} If the request is invalid or fails.
 */
export async function updateAcademy(id: number, data: AdminAcademyUpdate): Promise<AdminAcademy> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/academies/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new AdminAcademiesError(await readErrorDetail(response, "Could not save that academy."));
  }
  return (await response.json()) as AdminAcademy;
}

/**
 * Permanently delete an academy.
 *
 * @param id - The target academy's id.
 * @throws {AdminAcademiesError} If the request fails.
 */
export async function deleteAcademy(id: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/academies/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new AdminAcademiesError(await readErrorDetail(response, "Could not delete that academy."));
  }
}

async function uploadAcademyFile(id: number, path: string, fieldName: string, file: File): Promise<AdminAcademy> {
  const csrfToken = await fetchCsrfToken();
  const formData = new FormData();
  formData.append(fieldName, file);

  const response = await fetch(`${API_BASE_URL}/api/admin/academies/${id}/${path}/`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new AdminAcademiesError("Could not upload that file. Check its type and size.");
    }
    throw new AdminAcademiesError("Upload failed due to a server issue. Try again shortly.");
  }
  return (await response.json()) as AdminAcademy;
}

/**
 * Upload or replace an academy's logo.
 *
 * @param id - The target academy's id.
 * @param file - The image file (max 5MB).
 */
export function uploadAcademyLogo(id: number, file: File): Promise<AdminAcademy> {
  return uploadAcademyFile(id, "logo", "logo", file);
}

/**
 * Upload or replace an academy's legal/registration document.
 *
 * @param id - The target academy's id.
 * @param file - A PDF or image file (max 10MB).
 */
export function uploadAcademyLegalDocument(id: number, file: File): Promise<AdminAcademy> {
  return uploadAcademyFile(id, "legal-document", "legal_document", file);
}

/**
 * Upload or replace an academy's login-page background video.
 *
 * @param id - The target academy's id.
 * @param file - An mp4/webm/mov file (max 100MB).
 */
export function uploadAcademyLoginVideo(id: number, file: File): Promise<AdminAcademy> {
  return uploadAcademyFile(id, "login-video", "login_background_video", file);
}
