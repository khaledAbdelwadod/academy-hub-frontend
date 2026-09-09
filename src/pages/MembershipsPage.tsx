/** Superadmin membership overview: one row per academy, its manager, and active-member counts by role. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { AdminMembershipList, AdminMembershipListQuery, AdminMembershipRow } from "../api/adminMembershipsApi";
import { buildMembershipsUrl, listMemberships } from "../api/adminMembershipsApi";
import { AssignManagerModal } from "../components/admin/AssignManagerModal";
import { MembershipRowActionsMenu } from "../components/admin/MembershipRowActionsMenu";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: AdminMembershipList };

type FilterValues = Omit<AdminMembershipListQuery, "ordering">;

const EMPTY_FILTERS: FilterValues = { name: "" };

interface ColumnConfig {
  sortKey?: string;
  label: string;
  filterKey?: keyof FilterValues;
}

const COLUMNS: ColumnConfig[] = [
  { sortKey: "name", label: "Academy", filterKey: "name" },
  { label: "Manager email" },
  { sortKey: "admins_count", label: "Admins" },
  { sortKey: "coaches_count", label: "Coaches" },
  { sortKey: "players_count", label: "Players" },
];

export function MembershipsPage(): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [assignTarget, setAssignTarget] = useState<AdminMembershipRow | null>(null);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [ordering, setOrdering] = useState<string | null>(null);

  function fetchAndSetMemberships(url?: string): void {
    listMemberships(url)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load memberships.";
        logger.error("Failed to load memberships", { error: message });
        setState({ status: "error", message });
      });
  }

  function load(url?: string): void {
    setState({ status: "loading" });
    fetchAndSetMemberships(url);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      load(buildMembershipsUrl({ ...filters, ordering: ordering ?? undefined }));
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to filters/ordering, not the load function identity
  }, [filters, ordering]);

  function handleFilterChange(key: keyof FilterValues, value: string): void {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSort(sortKey: string): void {
    setOrdering((current) => {
      if (current === sortKey) return `-${sortKey}`;
      if (current === `-${sortKey}`) return null;
      return sortKey;
    });
  }

  function sortIndicator(sortKey: string): string {
    if (ordering === sortKey) return " ▲";
    if (ordering === `-${sortKey}`) return " ▼";
    return "";
  }

  function handleAssigned(row: AdminMembershipRow): void {
    setAssignTarget(null);
    setState((current) =>
      current.status === "ready"
        ? { status: "ready", page: { ...current.page, results: current.page.results.map((r) => (r.id === row.id ? row : r)) } }
        : current,
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col px-4 py-6 sm:px-8">
      {state.status === "error" && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          {state.message}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-xs font-bold uppercase tracking-wider text-mint">
                {COLUMNS.map((column) => (
                  <th key={column.label} className="whitespace-nowrap px-3 py-3">
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.sortKey!)}
                        className="transition-colors hover:text-pine"
                      >
                        {column.label}
                        {sortIndicator(column.sortKey)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                <th className="px-3 py-3" />
              </tr>
              <tr className="sticky top-[37px] z-10 divide-x divide-gray-300 border-b border-mint bg-white/40">
                {COLUMNS.map((column) => (
                  <th key={column.label} className="px-3 pb-3 align-middle">
                    {column.filterKey && (
                      <input
                        type="text"
                        value={filters[column.filterKey]}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleFilterChange(column.filterKey!, event.target.value)
                        }
                        placeholder="Search…"
                        className="w-full rounded-md border border-mint bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
                      />
                    )}
                  </th>
                ))}
                <th className="px-3 pb-3 align-middle" />
              </tr>
            </thead>
            <tbody>
              {state.status === "ready" &&
                state.page.results.map((row) => (
                  <tr key={row.id} className="divide-x divide-gray-300 border-b border-gray-300 text-black/80 hover:bg-mint/10">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-black">{row.name}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {row.manager_email ?? <span className="text-gray-400">Not assigned</span>}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{row.admins_count}</td>
                    <td className="px-3 py-3 tabular-nums">{row.coaches_count}</td>
                    <td className="px-3 py-3 tabular-nums">{row.players_count}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <MembershipRowActionsMenu onAssignManager={() => setAssignTarget(row)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading memberships…</p>}
          {state.status === "ready" && state.page.results.length === 0 && (
            <p className="py-10 text-center text-gray-400">No academies match these filters.</p>
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

      {assignTarget && (
        <AssignManagerModal
          academy={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
