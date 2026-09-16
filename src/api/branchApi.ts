/** API layer for an academy manager managing their academy's branches (training locations). */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** One of an academy's branches. */
export interface Branch {
  id: number;
  name: string;
  address: string;
  google_maps_url: string;
}

export type BranchInput = Pick<Branch, "name"> & Partial<Pick<Branch, "address" | "google_maps_url">>;
export type BranchUpdateInput = Partial<Pick<Branch, "name" | "address" | "google_maps_url">>;

export class BranchError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new BranchError("Could not reach Academy Hub. Check your connection and try again.");
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
 * List an academy's branches, for that academy's manager.
 *
 * @param subdomain - The academy's subdomain.
 * @returns The academy's branches.
 * @throws {BranchError} If the request fails.
 */
export async function listBranches(subdomain: string): Promise<Branch[]> {
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/branches/`, { credentials: "include" });
  if (!response.ok) {
    throw new BranchError("Could not load branches.");
  }
  const data = (await response.json()) as Branch[] | { results: Branch[] };
  return Array.isArray(data) ? data : data.results;
}

/**
 * Add a new branch to the academy (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param data - The branch's name, and optionally its address and Google Maps link.
 * @returns The created branch.
 * @throws {BranchError} If the request is invalid or fails.
 */
export async function createBranch(subdomain: string, data: BranchInput): Promise<Branch> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/branches/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new BranchError(await readErrorDetail(response, "Could not add that branch."));
  }
  return (await response.json()) as Branch;
}

/**
 * Edit a branch's name, address, and/or Google Maps link (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param branchId - The branch's id.
 * @param data - Any subset of the editable fields.
 * @returns The updated branch.
 * @throws {BranchError} If the request is invalid or fails.
 */
export async function updateBranch(subdomain: string, branchId: number, data: BranchUpdateInput): Promise<Branch> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/branches/${branchId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new BranchError(await readErrorDetail(response, "Could not save that branch."));
  }
  return (await response.json()) as Branch;
}

/**
 * Remove a branch from the academy (manager-only).
 *
 * @param subdomain - The academy's subdomain.
 * @param branchId - The branch's id.
 * @throws {BranchError} If the request fails.
 */
export async function deleteBranch(subdomain: string, branchId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/branches/${branchId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new BranchError(await readErrorDetail(response, "Could not remove that branch."));
  }
}
