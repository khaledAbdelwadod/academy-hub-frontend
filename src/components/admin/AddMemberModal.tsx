/** A modal for an academy manager to search registered users and add one as a member. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { ManagerMemberRow, ManagerUserSearchResult, MemberRole } from "../../api/managerMembersApi";
import { addMember, searchUsersToAdd } from "../../api/managerMembersApi";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";

interface AddMemberModalProps {
  subdomain: string;
  onClose: () => void;
  onAdded: (row: ManagerMemberRow) => void;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; results: ManagerUserSearchResult[] };

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Coach" },
  { value: "player", label: "Player" },
];

export function AddMemberModal({ subdomain, onClose, onAdded }: AddMemberModalProps): ReactElement {
  const [term, setTerm] = useState("");
  const [role, setRole] = useState<MemberRole>("player");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = term.trim();
    if (!trimmed) {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      setSearch({ status: "loading" });
      searchUsersToAdd(subdomain, trimmed)
        .then((results) => setSearch({ status: "ready", results }))
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Search failed.";
          setSearch({ status: "error", message });
        });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [term, subdomain]);

  function handlePick(user: ManagerUserSearchResult): void {
    setAddingUserId(user.id);
    setAddError(null);
    addMember(subdomain, user.id, role)
      .then((row) => onAdded(row))
      .catch((error: unknown) => {
        setAddError(error instanceof Error ? error.message : "Could not add that member.");
      })
      .finally(() => setAddingUserId(null));
  }

  return (
    <ModalShell title="Add member" onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-black/80">Role</span>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${
                  role === option.value
                    ? "border-mint bg-mint text-white"
                    : "border-mint bg-white text-black/80 hover:bg-mint/15"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <FormField
          id="am-search"
          label="Search by email or phone"
          value={term}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setTerm(event.target.value)}
          placeholder="amira@example.com"
          autoComplete="off"
        />

        {term.trim() !== "" && search.status === "loading" && (
          <p className="text-sm text-gray-500">Searching…</p>
        )}
        {term.trim() !== "" && search.status === "error" && <p className="text-sm text-red-400">{search.message}</p>}
        {term.trim() !== "" && search.status === "ready" && search.results.length === 0 && (
          <p className="text-sm text-gray-500">No users match.</p>
        )}
        {term.trim() !== "" && search.status === "ready" && search.results.length > 0 && (
          <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {search.results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => handlePick(user)}
                  disabled={addingUserId !== null}
                  className="flex w-full items-center justify-between rounded-lg border border-mint bg-white px-3 py-2 text-left text-sm text-black/80 transition-colors hover:bg-mint/15 disabled:opacity-60"
                >
                  <span>
                    <span className="font-semibold text-black">
                      {user.first_name} {user.last_name}
                    </span>{" "}
                    <span className="text-black/50">
                      {user.email} · {user.phone}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-mint">
                    {addingUserId === user.id ? "Adding…" : "Add"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {addError && <p className="text-sm text-red-400">{addError}</p>}
      </div>
    </ModalShell>
  );
}
