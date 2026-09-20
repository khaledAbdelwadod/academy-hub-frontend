/** A modal for the manager to subscribe several members to one plan at once. */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Plan } from "../../api/academySubscriptionApi";
import { assignPlan } from "../../api/academySubscriptionApi";
import type { ManagerMemberList } from "../../api/managerMembersApi";
import { buildMembersUrl, listMembers } from "../../api/managerMembersApi";
import { toDateKey } from "../../utils/calendarDates";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { SelectField } from "../ui/SelectField";

const SEARCH_DEBOUNCE_MS = 300;
/** How many matching members the picker lists at once; more are reached by searching. */
const MEMBER_PICKER_LIMIT = "100";

interface AssignMembersModalProps {
  subdomain: string;
  /** The plans that can be assigned (archived ones are left out by the caller). */
  plans: Plan[];
  onClose: () => void;
  /** Called after assigning, with how many members were subscribed and how many were already on the plan. */
  onAssigned: (result: { created: number; skipped: number }) => void;
}

interface MemberResult {
  query: string;
  result: { page: ManagerMemberList } | { error: string };
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export function AssignMembersModal({ subdomain, plans, onClose, onAssigned }: AssignMembersModalProps): ReactElement {
  const [planId, setPlanId] = useState(plans.length === 1 ? String(plans[0]?.id) : "");
  const [startedOn, setStartedOn] = useState(toDateKey(new Date()));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [members, setMembers] = useState<MemberResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const url = buildMembersUrl(subdomain, { status: "active", name: debouncedSearch, limit: MEMBER_PICKER_LIMIT });
    listMembers(url)
      .then((page) => {
        if (!cancelled) setMembers({ query: debouncedSearch, result: { page } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        logger.error("Failed to load members for assignment", { error: error instanceof Error ? error.message : error });
        setMembers({ query: debouncedSearch, result: { error: "Could not load members." } });
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain, debouncedSearch]);

  const shown = members && "page" in members.result ? members.result.page : null;
  const isLoading = members?.query !== debouncedSearch;

  function toggle(membershipId: number): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(membershipId)) next.delete(membershipId);
      else next.add(membershipId);
      return next;
    });
  }

  function selectAllShown(): void {
    setSelected((current) => new Set([...current, ...(shown?.results.map((member) => member.id) ?? [])]));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSaveState({ status: "saving" });
    assignPlan(subdomain, { plan_id: Number(planId), membership_ids: [...selected], started_on: startedOn })
      .then((result) => onAssigned({ created: result.created.length, skipped: result.skipped }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not assign that plan.";
        logger.error("Failed to assign plan", { error: message });
        setSaveState({ status: "error", message });
      });
  }

  const canSubmit = planId !== "" && selected.size > 0 && startedOn !== "" && saveState.status !== "saving";

  return (
    <ModalShell title="Assign Members" onClose={onClose} maxWidthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            id="assign-plan"
            label="Plan"
            options={plans.map((plan) => ({ value: String(plan.id), label: plan.name }))}
            value={planId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setPlanId(event.target.value)}
            required
          />
          <FormField
            id="assign-start"
            label="Starts on"
            type="date"
            value={startedOn}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setStartedOn(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-black/80">Members</span>
            <span className="text-xs text-black/60">{selected.size} selected</span>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
            placeholder="Search by name"
            aria-label="Search members"
            className="w-full rounded-xl border border-mint bg-white px-3.5 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
          />
          <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-lg border border-mint bg-white p-2">
            {isLoading && <p className="px-2 py-1.5 text-sm text-black/50">Loading…</p>}
            {!isLoading && shown?.results.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-black/50">No active members found.</p>
            )}
            {members && "error" in members.result && <p className="px-2 py-1.5 text-sm text-red-500">{members.result.error}</p>}
            {shown?.results.map((member) => (
              <label
                key={member.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black hover:bg-mint/15"
              >
                <input
                  type="checkbox"
                  checked={selected.has(member.id)}
                  onChange={() => toggle(member.id)}
                  className="size-3.5 accent-mint"
                />
                <span className="flex-1">
                  {member.first_name} {member.last_name}
                </span>
                <span className="text-xs capitalize text-black/45">{member.role}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-black/60">
            <span>
              {shown && shown.count > shown.results.length
                ? `Showing ${shown.results.length} of ${shown.count} - search to narrow it down.`
                : " "}
            </span>
            <span className="flex gap-3">
              <button type="button" onClick={selectAllShown} className="font-bold text-mint underline hover:text-pine">
                Select all shown
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="font-bold text-mint underline hover:text-pine"
              >
                Clear
              </button>
            </span>
          </div>
        </div>

        {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}

        <AuthButton type="submit" fullWidth={false} disabled={!canSubmit}>
          {saveState.status === "saving" ? "Assigning…" : "Assign plan"}
        </AuthButton>
      </form>
    </ModalShell>
  );
}
