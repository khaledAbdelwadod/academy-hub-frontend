/** An academy manager/admin's "Academy Teams" tab: create and manage teams of players. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { Team } from "../api/teamApi";
import { deleteTeam, listTeams } from "../api/teamApi";
import { TeamActionsMenu } from "../components/admin/TeamActionsMenu";
import { TeamFormModal } from "../components/admin/TeamFormModal";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; teams: Team[] };

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex shrink-0 items-center">
        <SmallButton variant="primary" onClick={() => setModalTarget("create")}>
          Add team
        </SmallButton>
      </div>

      {actionError && (
        <p className="shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{actionError}</p>
      )}
      {state.status === "error" && (
        <p className="shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{state.message}</p>
      )}

      {state.status === "loading" && (
        <p className="text-center text-sm text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">Loading…</p>
      )}
      {state.status === "ready" && state.teams.length === 0 && (
        <p className="text-center text-sm text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          No teams yet - add your first one above.
        </p>
      )}

      {state.status === "ready" &&
        state.teams.map((team) => (
          <div
            key={team.id}
            className="rounded-[22px] border border-mint bg-white/40 p-5 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-black">{team.name}</h2>
                {team.description && <p className="mt-1 text-sm text-black/60">{team.description}</p>}
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-mint">
                  {team.coach ? `Coach: ${team.coach.first_name} ${team.coach.last_name}` : "No coach assigned"}
                </p>
              </div>
              <TeamActionsMenu onEdit={() => setModalTarget(team)} onDelete={() => handleDelete(team)} />
            </div>

            <div className="mt-3 border-t border-mint pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-black/50">
                {team.players.length} player{team.players.length === 1 ? "" : "s"}
              </p>
              {team.players.length > 0 && (
                <p className="mt-1 text-sm text-black/70">
                  {team.players.map((player) => `${player.first_name} ${player.last_name}`).join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}

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
