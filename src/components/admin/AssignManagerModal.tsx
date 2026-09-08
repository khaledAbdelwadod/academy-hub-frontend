/** A modal for the superadmin to search users by email/phone and assign one as an academy's manager. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { AdminMembershipRow } from "../../api/adminMembershipsApi";
import { assignManager } from "../../api/adminMembershipsApi";
import type { AdminUser } from "../../api/adminUsersApi";
import { buildUsersUrl, listUsers } from "../../api/adminUsersApi";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";

interface AssignManagerModalProps {
  academy: AdminMembershipRow;
  onClose: () => void;
  onAssigned: (row: AdminMembershipRow) => void;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; results: AdminUser[] };

type AssignState = { status: "idle" } | { status: "assigning"; userId: number } | { status: "error"; message: string };

export function AssignManagerModal({ academy, onClose, onAssigned }: AssignManagerModalProps): ReactElement {
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [assignState, setAssignState] = useState<AssignState>({ status: "idle" });

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setSearch({ status: "loading" });
      listUsers(buildUsersUrl({ q: trimmed }))
        .then((page) => setSearch({ status: "ready", results: page.results }))
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Search failed.";
          setSearch({ status: "error", message });
        });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [term]);

  function handlePick(user: AdminUser): void {
    setAssignState({ status: "assigning", userId: user.id });
    assignManager(academy.id, user.id)
      .then((row) => onAssigned(row))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not assign that manager.";
        setAssignState({ status: "error", message });
      });
  }

  const isAssigning = assignState.status === "assigning";

  return (
    <ModalShell title={`Assign manager — ${academy.name}`} onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-4">
        {academy.manager_email && (
          <p className="text-sm text-white/70">
            Current manager: <span className="font-semibold text-white">{academy.manager_email}</span>
          </p>
        )}

        <FormField
          id="am-search"
          label="Search by email or phone"
          value={term}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setTerm(event.target.value)}
          placeholder="amira@example.com"
          autoComplete="off"
        />

        {term.trim() !== "" && search.status === "loading" && (
          <p className="text-sm text-white/50">Searching…</p>
        )}
        {term.trim() !== "" && search.status === "error" && (
          <p className="text-sm text-red-400">{search.message}</p>
        )}
        {term.trim() !== "" && search.status === "ready" && search.results.length === 0 && (
          <p className="text-sm text-white/50">No users match.</p>
        )}
        {term.trim() !== "" && search.status === "ready" && search.results.length > 0 && (
          <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {search.results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => handlePick(user)}
                  disabled={isAssigning}
                  className="flex w-full items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/10 disabled:opacity-60"
                >
                  <span>
                    <span className="font-semibold text-white">
                      {user.first_name} {user.last_name}
                    </span>{" "}
                    <span className="text-white/60">
                      {user.email} · {user.phone}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-teal">
                    {isAssigning && assignState.userId === user.id ? "Assigning…" : "Select"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {assignState.status === "error" && <p className="text-sm text-red-400">{assignState.message}</p>}
      </div>
    </ModalShell>
  );
}
