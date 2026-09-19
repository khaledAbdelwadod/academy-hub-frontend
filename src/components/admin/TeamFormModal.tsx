/** A modal for a manager/admin to create or edit a team: name, gender, description, coach, and roster. */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import { buildMembersUrl, listMembers } from "../../api/managerMembersApi";
import type { ManagerMemberRow } from "../../api/managerMembersApi";
import type { Team } from "../../api/teamApi";
import { createTeam, updateTeam } from "../../api/teamApi";
import { TEAM_GENDER_OPTIONS } from "../../utils/gender";
import type { TeamGender } from "../../utils/gender";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { SelectField } from "../ui/SelectField";

interface TeamFormModalProps {
  subdomain: string;
  /** The team being edited, or null to create a new one. */
  team: Team | null;
  onClose: () => void;
  onSaved: () => void;
}

type RosterState = { status: "loading" } | { status: "error" } | { status: "ready"; coaches: ManagerMemberRow[]; players: ManagerMemberRow[] };
type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export function TeamFormModal({ subdomain, team, onClose, onSaved }: TeamFormModalProps): ReactElement {
  const isCreate = team === null;
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [gender, setGender] = useState<string>(team?.gender ?? "");
  const [coachId, setCoachId] = useState<string>(team?.coach ? String(team.coach.id) : "");
  const [playerIds, setPlayerIds] = useState<Set<number>>(new Set(team?.players.map((p) => p.id) ?? []));
  const [roster, setRoster] = useState<RosterState>({ status: "loading" });
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    Promise.all([
      listMembers(buildMembersUrl(subdomain, { role: "coach", status: "active" })),
      listMembers(buildMembersUrl(subdomain, { role: "player", status: "active" })),
    ])
      .then(([coachPage, playerPage]) => setRoster({ status: "ready", coaches: coachPage.results, players: playerPage.results }))
      .catch(() => setRoster({ status: "error" }));
  }, [subdomain]);

  function togglePlayer(id: number): void {
    setPlayerIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !gender) return;

    const data = {
      name: trimmedName,
      gender: gender as TeamGender,
      description: description.trim(),
      coach_id: coachId ? Number(coachId) : null,
      player_ids: Array.from(playerIds),
    };

    setSaveState({ status: "saving" });
    const request = isCreate ? createTeam(subdomain, data) : updateTeam(subdomain, team.id, data);
    request
      .then(() => onSaved())
      .catch((error: unknown) => {
        setSaveState({ status: "error", message: error instanceof Error ? error.message : "Could not save that team." });
      });
  }

  return (
    <ModalShell title={isCreate ? "Create Team" : "Edit Team"} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField id="team-name" label="Team name" value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} placeholder="e.g. U12 Reds" required />

        <SelectField
          id="team-gender"
          label="Gender"
          options={TEAM_GENDER_OPTIONS}
          value={gender}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setGender(event.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="team-description"className="text-xs font-bold uppercase tracking-wider text-black/80">
            Description
          </label>
          <textarea
            id="team-description"
            value={description}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
            rows={2}
            className="w-full rounded-xl border border-mint bg-white px-3.5 py-3 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
          />
        </div>

        {roster.status === "loading" && <p className="text-sm text-gray-500">Loading coaches and players…</p>}
        {roster.status === "error" && <p className="text-sm text-red-400">Could not load coaches/players.</p>}

        {roster.status === "ready" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="team-coach" className="text-xs font-bold uppercase tracking-wider text-black/80">
                Coach
              </label>
              <select
                id="team-coach"
                value={coachId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setCoachId(event.target.value)}
                className="w-full rounded-xl border border-mint bg-white px-3.5 py-3 text-sm text-black focus:border-pine focus:outline-none"
              >
                <option value="">No coach assigned</option>
                {roster.coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.first_name} {coach.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-black/80">Players</span>
              {roster.players.length === 0 ? (
                <p className="rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black/50">
                  No active players at this academy yet.
                </p>
              ) : (
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-mint bg-white p-2">
                  {roster.players.map((player) => (
                    <label key={player.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black/80 hover:bg-mint/15">
                      <input
                        type="checkbox"
                        checked={playerIds.has(player.id)}
                        onChange={() => togglePlayer(player.id)}
                        className="size-3.5 accent-mint"
                      />
                      {player.first_name} {player.last_name}
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-black/40">A player already on another team will be moved to this one.</p>
            </div>
          </>
        )}

        {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}

        <AuthButton type="submit" fullWidth={false} disabled={saveState.status === "saving" || !name.trim() || !gender}>
          {saveState.status === "saving" ? "Saving…" : isCreate ? "Create team" : "Save changes"}
        </AuthButton>
      </form>
    </ModalShell>
  );
}
