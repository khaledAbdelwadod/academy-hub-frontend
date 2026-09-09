/** An academy manager's "Academy Members" tab: view, add, and manage the academy's own members. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { ManagerMemberList, ManagerMemberListQuery, ManagerMemberRow, MemberRole } from "../api/managerMembersApi";
import { buildMembersUrl, listMembers, removeMember, updateMember } from "../api/managerMembersApi";
import { AddMemberModal } from "../components/admin/AddMemberModal";
import { MemberRowActionsMenu } from "../components/admin/MemberRowActionsMenu";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: ManagerMemberList };

type FilterValues = Omit<ManagerMemberListQuery, "ordering">;

const EMPTY_FILTERS: FilterValues = { name: "", role: "", status: "" };

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Coach" },
  { value: "player", label: "Player" },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function StatusBadge({ status }: { status: ManagerMemberRow["status"] }): ReactElement {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold capitalize ${
        isActive ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}

export function AcademyMembersPage(): ReactElement {
  const subdomain = getAcademySubdomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);

  function fetchAndSetMembers(url?: string): void {
    if (!subdomain) return;
    listMembers(url, subdomain)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load members.";
        logger.error("Failed to load academy members", { error: message });
        setState({ status: "error", message });
      });
  }

  function load(url?: string): void {
    setState({ status: "loading" });
    fetchAndSetMembers(url);
  }

  useEffect(() => {
    if (!subdomain) return undefined;
    const timeout = window.setTimeout(() => {
      load(buildMembersUrl(subdomain, filters));
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to filters, not the load function identity
  }, [filters, subdomain]);

  function handleFilterChange(key: keyof FilterValues, value: string): void {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function reload(): void {
    if (!subdomain) return;
    load(buildMembersUrl(subdomain, filters));
  }

  function handleAdded(): void {
    setShowAddModal(false);
    reload();
  }

  function handleRoleChange(member: ManagerMemberRow, role: MemberRole): void {
    if (!subdomain) return;
    setActionError(null);
    updateMember(subdomain, member.id, { role })
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not update that member's role.";
        logger.error("Failed to update member role", { error: message });
        setActionError(message);
      });
  }

  function handleToggleStatus(member: ManagerMemberRow): void {
    if (!subdomain) return;
    setActionError(null);
    const nextStatus = member.status === "active" ? "suspended" : "active";
    updateMember(subdomain, member.id, { status: nextStatus })
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not update that member's status.";
        logger.error("Failed to update member status", { error: message });
        setActionError(message);
      });
  }

  function handleRemove(member: ManagerMemberRow): void {
    if (!subdomain) return;
    const warning = `Remove ${member.first_name} ${member.last_name} from this academy?`;
    if (!window.confirm(warning)) return;

    setActionError(null);
    removeMember(subdomain, member.id)
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not remove that member.";
        logger.error("Failed to remove member", { error: message });
        setActionError(message);
      });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col px-4 py-6 sm:px-8">
      <div className="mb-4 flex shrink-0 items-center">
        <SmallButton variant="primary" onClick={() => setShowAddModal(true)}>
          Add member
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-xs font-bold uppercase tracking-wider text-mint">
                <th className="whitespace-nowrap px-3 py-3">Name</th>
                <th className="whitespace-nowrap px-3 py-3">Email</th>
                <th className="whitespace-nowrap px-3 py-3">Phone</th>
                <th className="whitespace-nowrap px-3 py-3">Date of birth</th>
                <th className="whitespace-nowrap px-3 py-3">Role</th>
                <th className="whitespace-nowrap px-3 py-3">Status</th>
                <th className="whitespace-nowrap px-3 py-3">Joined</th>
                <th className="px-3 py-3" />
              </tr>
              <tr className="sticky top-[37px] z-10 divide-x divide-gray-300 border-b border-mint bg-white/40">
                <th className="px-3 pb-3 align-middle">
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleFilterChange("name", event.target.value)}
                    placeholder="Search…"
                    className="w-full rounded-md border border-mint bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
                  />
                </th>
                <th className="px-3 pb-3 align-middle" />
                <th className="px-3 pb-3 align-middle" />
                <th className="px-3 pb-3 align-middle" />
                <th className="px-3 pb-3 align-middle">
                  <select
                    value={filters.role}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => handleFilterChange("role", event.target.value)}
                    className="w-full rounded-md border border-mint bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-black focus:border-pine focus:outline-none"
                  >
                    <option value="">All roles</option>
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-3 pb-3 align-middle">
                  <select
                    value={filters.status}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => handleFilterChange("status", event.target.value)}
                    className="w-full rounded-md border border-mint bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-black focus:border-pine focus:outline-none"
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="invited">Invited</option>
                    <option value="requested">Requested</option>
                  </select>
                </th>
                <th className="px-3 pb-3 align-middle" />
                <th className="px-3 pb-3 align-middle" />
              </tr>
            </thead>
            <tbody>
              {state.status === "ready" &&
                state.page.results.map((member) => (
                  <tr
                    key={member.id}
                    className="divide-x divide-gray-300 border-b border-gray-300 text-black/80 hover:bg-mint/10"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-black">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{member.email}</td>
                    <td className="whitespace-nowrap px-3 py-3">{member.phone}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(member.date_of_birth)}</td>
                    <td className="px-3 py-3">
                      <select
                        value={member.role}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          handleRoleChange(member, event.target.value as MemberRole)
                        }
                        className="rounded-md border border-mint bg-white px-2 py-1 text-xs font-bold uppercase tracking-wide text-black focus:border-pine focus:outline-none"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(member.joined_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <MemberRowActionsMenu
                        member={member}
                        onToggleStatus={() => handleToggleStatus(member)}
                        onRemove={() => handleRemove(member)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading members…</p>}
          {state.status === "ready" && state.page.results.length === 0 && (
            <p className="py-10 text-center text-gray-400">No members match these filters.</p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-mint px-4 py-3 text-sm text-gray-500">
          <span>{state.status === "ready" ? state.page.count : "…"} total</span>
          <div className="flex gap-2">
            <SmallButton
              disabled={state.status !== "ready" || !state.page.previous}
              onClick={() => state.status === "ready" && state.page.previous && load(state.page.previous)}
            >
              Previous
            </SmallButton>
            <SmallButton
              disabled={state.status !== "ready" || !state.page.next}
              onClick={() => state.status === "ready" && state.page.next && load(state.page.next)}
            >
              Next
            </SmallButton>
          </div>
        </div>
      </div>

      {showAddModal && subdomain && (
        <AddMemberModal subdomain={subdomain} onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}
    </div>
  );
}
