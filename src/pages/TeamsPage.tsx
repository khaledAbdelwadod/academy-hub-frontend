/** An academy manager/admin's "Academy Teams" tab: create and manage teams of players. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { Team } from "../api/teamApi";
import { deleteTeam, listTeams } from "../api/teamApi";
import { TeamActionsMenu } from "../components/admin/TeamActionsMenu";
import { TeamFormModal } from "../components/admin/TeamFormModal";
import { SmallButton } from "../components/ui/SmallButton";
import { formatGender } from "../utils/gender";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; teams: Team[] };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function TeamsPage(): ReactElement {
  const subdomain = getAcademySubdomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [modalTarget, setModalTarget] = useState<Team | "create" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload(): void {
    if (!subdomain) return;
    listTeams(subdomain)
      .then((teams) => setState({ status: "ready", teams }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load teams.";
        logger.error("Failed to load teams", { error: message });
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
  }, [subdomain]);

  function handleSaved(): void {
    setModalTarget(null);
    reload();
  }

  function handleDelete(team: Team): void {
    if (!subdomain) return;
    if (!window.confirm(`Delete "${team.name}"? Its players will no longer be on a team.`)) return;

    setActionError(null);
    deleteTeam(subdomain, team.id)
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not delete that team.";
        logger.error("Failed to delete team", { error: message });
        setActionError(message);
      });
  }

  if (!subdomain) {
    return <div className="min-h-full" />;
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[900px] flex-col px-4 py-6 sm:px-8">
      <div className="mb-4 flex shrink-0 items-center">
        <SmallButton variant="primary" onClick={() => setModalTarget("create")}>
          Add team
        </SmallButton>
      </div>

      {actionError && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{actionError}</p>
      )}
      {state.status === "error" && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          {state.message}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-sm font-bold uppercase tracking-wider text-mint">
                <th className="whitespace-nowrap px-3 py-3">Name</th>
                <th className="whitespace-nowrap px-3 py-3">Gender</th>
                <th className="whitespace-nowrap px-3 py-3">Description</th>
                <th className="whitespace-nowrap px-3 py-3">Coach</th>
                <th className="px-3 py-3">Players</th>
                <th className="whitespace-nowrap px-3 py-3">Created</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {state.status === "ready" &&
                state.teams.map((team) => (
                  <tr
                    key={team.id}
                    className="divide-x divide-gray-300 border-b border-gray-300 text-black hover:bg-mint/10"
                  >
                    <td className="px-3 py-3 font-semibold text-black">{team.name}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatGender(team.gender)}</td>
                    <td className="px-3 py-3">{team.description || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3">
                      {team.coach ? (
                        `${team.coach.first_name} ${team.coach.last_name}`
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {team.players.length === 0 ? (
                        <span className="text-gray-400">No players</span>
                      ) : (
                        `${team.players.length} - ${team.players.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}`
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(team.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <TeamActionsMenu onEdit={() => setModalTarget(team)} onDelete={() => handleDelete(team)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading teams…</p>}
          {state.status === "ready" && state.teams.length === 0 && (
            <p className="py-10 text-center text-gray-400">No teams yet - add your first one above.</p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-mint px-4 py-3 text-sm text-gray-500">
          <span>{state.status === "ready" ? state.teams.length : "…"} total</span>
        </div>
      </div>

      {modalTarget !== null && (
        <TeamFormModal
          subdomain={subdomain}
          team={modalTarget === "create" ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
