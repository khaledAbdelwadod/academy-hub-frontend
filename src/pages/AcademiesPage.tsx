/** Superadmin academy management: a table of every academy with search, sort, create/edit/deactivate/delete. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { AdminAcademy, AdminAcademyList, AdminAcademyListQuery } from "../api/adminAcademiesApi";
import { buildAcademiesUrl, deleteAcademy, listAcademies, updateAcademy } from "../api/adminAcademiesApi";
import { AcademyFormModal } from "../components/admin/AcademyFormModal";
import { AcademyRowActionsMenu } from "../components/admin/AcademyRowActionsMenu";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: AdminAcademyList };

type FilterValues = Omit<AdminAcademyListQuery, "ordering">;

const EMPTY_FILTERS: FilterValues = {
  name: "",
  subdomain: "",
  contact_email: "",
  contact_phone: "",
  is_active: "",
};

interface ColumnConfig {
  /** The field name to sort/filter by on the backend; omit if not sortable. */
  sortKey?: string;
  label: string;
  filterKey?: keyof FilterValues;
  filterType?: "text" | "boolean";
}

const COLUMNS: ColumnConfig[] = [
  { sortKey: "name", label: "Name", filterKey: "name", filterType: "text" },
  { sortKey: "subdomain", label: "Subdomain", filterKey: "subdomain", filterType: "text" },
  { sortKey: "contact_email", label: "Contact email", filterKey: "contact_email", filterType: "text" },
  { sortKey: "contact_phone", label: "Contact phone", filterKey: "contact_phone", filterType: "text" },
  { label: "Logo" },
  { label: "Login video" },
  { label: "Legal doc" },
  { sortKey: "is_active", label: "Active", filterKey: "is_active", filterType: "boolean" },
  { sortKey: "created_at", label: "Created" },
];

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
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

/** A read-only "View" link for a media file set by the academy manager, or a dash when unset. */
function FileLink({ url }: { url: string | null }): ReactElement {
  if (!url) {
    return <span className="text-gray-300">—</span>;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-teal underline">
      View
    </a>
  );
}

export function AcademiesPage(): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [formTarget, setFormTarget] = useState<AdminAcademy | "create" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [ordering, setOrdering] = useState<string | null>(null);

  function fetchAndSetAcademies(url?: string): void {
    listAcademies(url)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load academies.";
        logger.error("Failed to load academies", { error: message });
        setState({ status: "error", message });
      });
  }

  function load(url?: string): void {
    setState({ status: "loading" });
    fetchAndSetAcademies(url);
  }

  // Refetch whenever a filter or the sort order changes, debounced so typing in
  // a search box doesn't fire a request per keystroke. This also covers the
  // very first load - setState only happens inside the timeout callback, never
  // synchronously in the effect body.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      load(buildAcademiesUrl({ ...filters, ordering: ordering ?? undefined }));
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
    load(buildAcademiesUrl({ ...filters, ordering: ordering ?? undefined }));
  }

  function handleToggleActive(target: AdminAcademy): void {
    setActionError(null);
    updateAcademy(target.id, { is_active: !target.is_active })
      .then(() => load(buildAcademiesUrl({ ...filters, ordering: ordering ?? undefined })))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not update that academy.";
        logger.error("Failed to toggle active status", { error: message });
        setActionError(message);
      });
  }

  function handleDelete(target: AdminAcademy): void {
    const warning = `Delete ${target.name} permanently? This cannot be undone.`;
    if (!window.confirm(warning)) {
      return;
    }

    setActionError(null);
    deleteAcademy(target.id)
      .then(() => load(buildAcademiesUrl({ ...filters, ordering: ordering ?? undefined })))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not delete that academy.";
        logger.error("Failed to delete academy", { error: message });
        setActionError(message);
      });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col px-4 py-6 sm:px-8">
      <div className="mb-4 flex shrink-0 items-center">
        <SmallButton variant="primary" onClick={() => setFormTarget("create")}>
          Create academy
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
          <table className="w-full min-w-[1250px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-100 border-b border-mint bg-white text-left text-xs font-bold uppercase tracking-wider text-gray-500">
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
              <tr className="sticky top-[37px] z-10 divide-x divide-gray-100 border-b border-mint bg-white">
                {COLUMNS.map((column) => (
                  <th key={column.label} className="px-3 pb-3">
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
                <th className="px-3 pb-3" />
              </tr>
            </thead>
            <tbody>
              {state.status === "ready" &&
                state.page.results.map((row) => (
                  <tr key={row.id} className="divide-x divide-gray-100 border-b border-gray-100 text-black/80 hover:bg-mint/10">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-black">{row.name}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.subdomain}.academy-hub.net</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.contact_email}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.contact_phone}</td>
                    <td className="px-3 py-3">
                      <FileLink url={row.logo} />
                    </td>
                    <td className="px-3 py-3">
                      <FileLink url={row.login_background_video} />
                    </td>
                    <td className="px-3 py-3">
                      <FileLink url={row.legal_document} />
                    </td>
                    <td className="px-3 py-3">
                      <Badge ok={row.is_active} label={row.is_active ? "Active" : "Inactive"} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDateTime(row.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <AcademyRowActionsMenu
                        academy={row}
                        onEdit={() => setFormTarget(row)}
                        onToggleActive={() => handleToggleActive(row)}
                        onDelete={() => handleDelete(row)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading academies…</p>}
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

      {formTarget !== null && (
        <AcademyFormModal
          academy={formTarget === "create" ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
