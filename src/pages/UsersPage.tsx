/** Superadmin user management: a table of every account with create/edit/deactivate/delete. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { AdminUser, AdminUserList } from "../api/adminUsersApi";
import { deleteUser, listUsers, updateUser } from "../api/adminUsersApi";
import { RowActionsMenu } from "../components/admin/RowActionsMenu";
import { UserFormModal } from "../components/admin/UserFormModal";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: AdminUserList };

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
        ok ? "bg-teal/20 text-teal" : "bg-white/10 text-white/50"
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

  function fetchAndSetUsers(url?: string): void {
    listUsers(url)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load users.";
        logger.error("Failed to load users", { error: message });
        setState({ status: "error", message });
      });
  }

  // Initial fetch relies on the useState default already being "loading" -
  // setState is never called synchronously from inside this effect.
  useEffect(() => {
    fetchAndSetUsers();
  }, []);

  function load(url?: string): void {
    setState({ status: "loading" });
    fetchAndSetUsers(url);
  }

  function handleSaved(): void {
    setFormTarget(null);
    load();
  }

  function handleToggleActive(target: AdminUser): void {
    setActionError(null);
    updateUser(target.id, { is_active: !target.is_active })
      .then(() => load())
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
      .then(() => load())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not delete that user.";
        logger.error("Failed to delete user", { error: message });
        setActionError(message);
      });
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Users</h1>
        <SmallButton variant="primary" onClick={() => setFormTarget("create")}>
          Create user
        </SmallButton>
      </div>

      {actionError && <p className="mb-4 shrink-0 text-sm text-red-400">{actionError}</p>}

      {state.status === "loading" && <p className="py-10 text-center text-white/70">Loading users…</p>}
      {state.status === "error" && <p className="py-10 text-center text-red-400">{state.message}</p>}

      {state.status === "ready" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/15 bg-black/45 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[1150px] border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-white/15 bg-black/45 text-left text-xs font-bold uppercase tracking-wider text-white/50 backdrop-blur-2xl">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Date of birth</th>
                  <th className="px-3 py-3">Email verified</th>
                  <th className="px-3 py-3">Phone verified</th>
                  <th className="px-3 py-3">Active</th>
                  <th className="px-3 py-3">Staff</th>
                  <th className="px-3 py-3">Super admin</th>
                  <th className="px-3 py-3">Member since</th>
                  <th className="px-3 py-3">Last login</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {state.page.results.map((row) => (
                  <tr key={row.id} className="border-b border-white/8 text-white/85 hover:bg-white/5">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-white">
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
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-white/15 px-4 py-3 text-sm text-white/60">
            <span>{state.page.count} total</span>
            <div className="flex gap-2">
              <SmallButton disabled={!state.page.previous} onClick={() => state.page.previous && load(state.page.previous)}>
                Previous
              </SmallButton>
              <SmallButton disabled={!state.page.next} onClick={() => state.page.next && load(state.page.next)}>
                Next
              </SmallButton>
            </div>
          </div>
        </div>
      )}

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
