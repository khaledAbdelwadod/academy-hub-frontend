/** Superadmin user management: a table of every account with search, sort, create/edit/deactivate/delete. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { AdminUser, AdminUserList, AdminUserListQuery } from "../api/adminUsersApi";
import { buildUsersUrl, deleteUser, listUsers, updateUser } from "../api/adminUsersApi";
import { RowActionsMenu } from "../components/admin/RowActionsMenu";
import { UserFormModal } from "../components/admin/UserFormModal";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: AdminUserList };

type FilterValues = Omit<AdminUserListQuery, "ordering">;

const EMPTY_FILTERS: FilterValues = {
  name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  email_verified: "",
  phone_verified: "",
  is_active: "",
  is_staff: "",
  is_superuser: "",
};

interface ColumnConfig {
  /** The field name to sort/filter by on the backend; omit if not sortable. */
  sortKey?: string;
  label: string;
  filterKey?: keyof FilterValues;
  filterType?: "text" | "date" | "boolean";
}

const COLUMNS: ColumnConfig[] = [
  { sortKey: "first_name", label: "Name", filterKey: "name", filterType: "text" },
  { sortKey: "email", label: "Email", filterKey: "email", filterType: "text" },
  { sortKey: "phone", label: "Phone", filterKey: "phone", filterType: "text" },
  { sortKey: "date_of_birth", label: "Date of birth", filterKey: "date_of_birth", filterType: "date" },
  { sortKey: "email_verified", label: "Email verified", filterKey: "email_verified", filterType: "boolean" },
  { sortKey: "phone_verified", label: "Phone verified", filterKey: "phone_verified", filterType: "boolean" },
  { sortKey: "is_active", label: "Active", filterKey: "is_active", filterType: "boolean" },
  { sortKey: "is_staff", label: "Staff", filterKey: "is_staff", filterType: "boolean" },
  { sortKey: "is_superuser", label: "Super admin", filterKey: "is_superuser", filterType: "boolean" },
  { sortKey: "created_at", label: "Member since" },
  { sortKey: "last_login", label: "Last login" },
];

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

function Badge({ ok, label }: { ok: boolean; label: string }): ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
        ok ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
      }`}
    >
      {label}
    </span>
  );
}

export function UsersPage(): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [formTarget, setFormTarget] = useState<AdminUser | "create" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [ordering, setOrdering] = useState<string | null>(null);

  function fetchAndSetUsers(url?: string): void {
    listUsers(url)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load users.";
        logger.error("Failed to load users", { error: message });
        setState({ status: "error", message });
      });
  }

  function load(url?: string): void {
    setState({ status: "loading" });
    fetchAndSetUsers(url);
  }

  // Refetch whenever a filter or the sort order changes, debounced so typing in
  // a search box doesn't fire a request per keystroke. This also covers the
  // very first load - setState only happens inside the timeout callback, never
  // synchronously in the effect body.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      load(buildUsersUrl({ ...filters, ordering: ordering ?? undefined }));
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

  function handleSaved(): void {
    setFormTarget(null);
    load(buildUsersUrl({ ...filters, ordering: ordering ?? undefined }));
  }

  function handleToggleActive(target: AdminUser): void {
    setActionError(null);
    updateUser(target.id, { is_active: !target.is_active })
      .then(() => load(buildUsersUrl({ ...filters, ordering: ordering ?? undefined })))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not update that user.";
        logger.error("Failed to toggle active status", { error: message });
        setActionError(message);
      });
  }

  function handleDelete(target: AdminUser): void {
    const warning = `Delete ${target.first_name} ${target.last_name}'s account permanently?`;
    if (!window.confirm(warning)) {
      return;
    }

    setActionError(null);
    deleteUser(target.id)
      .then(() => load(buildUsersUrl({ ...filters, ordering: ordering ?? undefined })))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not delete that user.";
        logger.error("Failed to delete user", { error: message });
        setActionError(message);
      });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col px-4 py-6 sm:px-8">
      <div className="mb-4 flex shrink-0 items-center">
        <SmallButton variant="primary" onClick={() => setFormTarget("create")}>
          Create user
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)]">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1150px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                {COLUMNS.map((column) => (
                  <th key={column.label} className="whitespace-nowrap px-3 py-3">
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.sortKey!)}
                        className="transition-colors hover:text-mint"
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
              <tr className="sticky top-[37px] z-10 divide-x divide-gray-300 border-b border-mint bg-white">
                {COLUMNS.map((column) => (
                  <th key={column.label} className="px-3 pb-3 align-middle">
                    {column.filterKey && column.filterType === "text" && (
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
                    {column.filterKey && column.filterType === "date" && (
                      <input
                        type="date"
                        value={filters[column.filterKey]}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handleFilterChange(column.filterKey!, event.target.value)
                        }
                        className="w-full rounded-md border border-mint bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-black focus:border-pine focus:outline-none"
                      />
                    )}
                    {column.filterKey && column.filterType === "boolean" && (
                      <select
                        value={filters[column.filterKey]}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          handleFilterChange(column.filterKey!, event.target.value)
                        }
                        className="w-full rounded-md border border-mint bg-white px-2 py-1 text-xs font-normal normal-case tracking-normal text-black focus:border-pine focus:outline-none"
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
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
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-black">
                      {row.first_name} {row.middle_name} {row.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{row.email}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.phone}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(row.date_of_birth)}</td>
                    <td className="px-3 py-3">
                      <Badge ok={row.email_verified} label={row.email_verified ? "Verified" : "Unverified"} />
                    </td>
                    <td className="px-3 py-3">
                      <Badge ok={row.phone_verified} label={row.phone_verified ? "Verified" : "Unverified"} />
                    </td>
                    <td className="px-3 py-3">
                      <Badge ok={row.is_active} label={row.is_active ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-3 py-3">{row.is_staff ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">{row.is_superuser ? "Yes" : "No"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDateTime(row.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDateTime(row.last_login)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <RowActionsMenu
                        user={row}
                        onEdit={() => setFormTarget(row)}
                        onToggleActive={() => handleToggleActive(row)}
                        onDelete={() => handleDelete(row)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading users…</p>}
          {state.status === "ready" && state.page.results.length === 0 && (
            <p className="py-10 text-center text-gray-400">No users match these filters.</p>
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

      {formTarget !== null && (
        <UserFormModal
          user={formTarget === "create" ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
