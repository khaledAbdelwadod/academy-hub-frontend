/** Picks who an event is for: whole teams and/or individual members. */

import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { AudienceOptions } from "../../api/eventApi";

interface AudiencePickerProps {
  options: AudienceOptions;
  selectedTeamIds: Set<number>;
  selectedMemberIds: Set<number>;
  onToggleTeam: (teamId: number) => void;
  onToggleMember: (membershipId: number) => void;
}

const SECTION_LABEL_CLASS = "text-xs font-bold uppercase tracking-wider text-black/80";
const ROW_CLASS = "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black/80 hover:bg-mint/15";

function TeamList({
  teams,
  selected,
  onToggle,
}: {
  teams: AudienceOptions["teams"];
  selected: Set<number>;
  onToggle: (teamId: number) => void;
}): ReactElement {
  if (teams.length === 0) {
    return <p className="rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black/50">No teams available.</p>;
  }
  return (
    <div className="flex max-h-32 flex-col gap-0.5 overflow-y-auto rounded-lg border border-mint bg-white p-2">
      {teams.map((team) => (
        <label key={team.id} className={ROW_CLASS}>
          <input
            type="checkbox"
            checked={selected.has(team.id)}
            onChange={() => onToggle(team.id)}
            className="size-3.5 accent-mint"
          />
          {team.name}
        </label>
      ))}
    </div>
  );
}

export function AudiencePicker({
  options,
  selectedTeamIds,
  selectedMemberIds,
  onToggleTeam,
  onToggleMember,
}: AudiencePickerProps): ReactElement {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleMembers = options.members.filter((member) =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className={SECTION_LABEL_CLASS}>Teams</span>
        <TeamList teams={options.teams} selected={selectedTeamIds} onToggle={onToggleTeam} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={SECTION_LABEL_CLASS}>Individual members</span>
        <input
          type="search"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder="Search by name"
          aria-label="Search members"
          className="w-full rounded-xl border border-mint bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
        />
        <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto rounded-lg border border-mint bg-white p-2">
          {visibleMembers.length === 0 && <p className="px-2 py-1.5 text-sm text-black/50">No members found.</p>}
          {visibleMembers.map((member) => (
            <label key={member.id} className={ROW_CLASS}>
              <input
                type="checkbox"
                checked={selectedMemberIds.has(member.id)}
                onChange={() => onToggleMember(member.id)}
                className="size-3.5 accent-mint"
              />
              <span className="flex-1">
                {member.first_name} {member.last_name}
              </span>
              <span className="text-xs capitalize text-black/45">{member.role}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
