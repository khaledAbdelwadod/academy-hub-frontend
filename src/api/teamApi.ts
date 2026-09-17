/** API layer for an academy manager/admin managing their academy's teams. */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

/** A minimal member summary - used for a team's coach and roster display. */
export interface TeamMemberSummary {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  coach: TeamMemberSummary | null;
  players: TeamMemberSummary[];
  created_at: string;
}

export interface TeamInput {
  name: string;
  description?: string;
  coach_id?: number | null;
  player_ids?: number[];
}

export class TeamError extends Error {}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrfToken(): Promise<string> {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, { credentials: "include" });
  const token = readCookie("csrftoken");
  if (!token) {
    throw new TeamError("Could not reach Academy Hub. Check your connection and try again.");
  }
  return token;
}

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object") {
    for (const key of ["detail", "coach_id", "player_ids", "name"]) {
      const value = (body as Record<string, unknown>)[key];
      if (typeof value === "string") return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0] as string;
    }
  }
  return fallback;
}

/**
 * List an academy's teams, for that academy's manager/admin.
 *
 * @param subdomain - The academy's subdomain.
 * @returns The academy's teams.
 * @throws {TeamError} If the request fails.
 */
export async function listTeams(subdomain: string): Promise<Team[]> {
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/teams/`, { credentials: "include" });
  if (!response.ok) {
    throw new TeamError("Could not load teams.");
  }
  const data = (await response.json()) as Team[] | { results: Team[] };
  return Array.isArray(data) ? data : data.results;
}

/**
 * Create a new team.
 *
 * @param subdomain - The academy's subdomain.
 * @param data - The team's name, and optionally its description, coach, and player roster.
 * @returns The created team.
 * @throws {TeamError} If the request is invalid or fails.
 */
export async function createTeam(subdomain: string, data: TeamInput): Promise<Team> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/teams/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new TeamError(await readErrorDetail(response, "Could not create that team."));
  }
  return (await response.json()) as Team;
}

/**
 * Edit a team's fields and/or its coach/roster.
 *
 * @param subdomain - The academy's subdomain.
 * @param teamId - The team's id.
 * @param data - Any subset of the editable fields.
 * @returns The updated team.
 * @throws {TeamError} If the request is invalid or fails.
 */
export async function updateTeam(subdomain: string, teamId: number, data: Partial<TeamInput>): Promise<Team> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/teams/${teamId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new TeamError(await readErrorDetail(response, "Could not save that team."));
  }
  return (await response.json()) as Team;
}

/**
 * Delete a team (its players fall back to no team).
 *
 * @param subdomain - The academy's subdomain.
 * @param teamId - The team's id.
 * @throws {TeamError} If the request fails.
 */
export async function deleteTeam(subdomain: string, teamId: number): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/academies/${subdomain}/teams/${teamId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-CSRFToken": csrfToken },
  });
  if (!response.ok) {
    throw new TeamError(await readErrorDetail(response, "Could not delete that team."));
  }
}
