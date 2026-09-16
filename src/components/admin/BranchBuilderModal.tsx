/** A modal for an academy manager to add, edit, and remove their academy's branches. */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Branch } from "../../api/branchApi";
import { createBranch, deleteBranch, listBranches, updateBranch } from "../../api/branchApi";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { SmallButton } from "../ui/SmallButton";

interface BranchBuilderModalProps {
  subdomain: string;
  onClose: () => void;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; branches: Branch[] };

interface BranchFormValues {
  name: string;
  address: string;
  google_maps_url: string;
}

const EMPTY_FORM: BranchFormValues = { name: "", address: "", google_maps_url: "" };

export function BranchBuilderModal({ subdomain, onClose }: BranchBuilderModalProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BranchFormValues>(EMPTY_FORM);
  const [newForm, setNewForm] = useState<BranchFormValues>(EMPTY_FORM);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reload(): void {
    listBranches(subdomain)
      .then((branches) => setState({ status: "ready", branches }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load branches.";
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
  }, [subdomain]);

  function handleAdd(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const name = newForm.name.trim();
    if (!name) return;

    setBusy(true);
    setActionError(null);
    createBranch(subdomain, {
      name,
      address: newForm.address.trim(),
      google_maps_url: newForm.google_maps_url.trim(),
    })
      .then(() => {
        setNewForm(EMPTY_FORM);
        reload();
      })
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not add that branch.");
      })
      .finally(() => setBusy(false));
  }

  function startEdit(branch: Branch): void {
    setEditingId(branch.id);
    setEditForm({ name: branch.name, address: branch.address, google_maps_url: branch.google_maps_url });
  }

  function handleSaveEdit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (editingId === null) return;
    const name = editForm.name.trim();
    if (!name) return;

    setBusy(true);
    setActionError(null);
    updateBranch(subdomain, editingId, {
      name,
      address: editForm.address.trim(),
      google_maps_url: editForm.google_maps_url.trim(),
    })
      .then(() => {
        setEditingId(null);
        reload();
      })
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not save that branch.");
      })
      .finally(() => setBusy(false));
  }

  function handleDelete(branch: Branch): void {
    if (!window.confirm(`Remove "${branch.name}"?`)) return;

    setBusy(true);
    setActionError(null);
    deleteBranch(subdomain, branch.id)
      .then(() => reload())
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not remove that branch.");
      })
      .finally(() => setBusy(false));
  }

  const branches = state.status === "ready" ? state.branches : [];

  return (
    <ModalShell title="Branches" onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-black/60">Manage every location your academy trains at.</p>

        {state.status === "loading" && <p className="text-sm text-gray-500">Loading…</p>}
        {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

        {state.status === "ready" && branches.length === 0 && (
          <p className="rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black/60">
            No branches yet - add your first one below.
          </p>
        )}

        {branches.length > 0 && (
          <ul className="flex flex-col gap-2">
            {branches.map((branch) =>
              editingId === branch.id ? (
                <li key={branch.id} className="rounded-lg border border-mint bg-white p-3">
                  <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                    <FormField
                      id={`branch-name-${branch.id}`}
                      label="Branch name"
                      value={editForm.name}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setEditForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                    <FormField
                      id={`branch-address-${branch.id}`}
                      label="Branch address"
                      optional
                      value={editForm.address}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setEditForm((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                    <FormField
                      id={`branch-maps-${branch.id}`}
                      label="Branch location (Google Maps link)"
                      optional
                      type="url"
                      value={editForm.google_maps_url}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setEditForm((current) => ({ ...current, google_maps_url: event.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <SmallButton type="submit" variant="primary" disabled={busy || !editForm.name.trim()}>
                        Save
                      </SmallButton>
                      <SmallButton type="button" disabled={busy} onClick={() => setEditingId(null)}>
                        Cancel
                      </SmallButton>
                    </div>
                  </form>
                </li>
              ) : (
                <li
                  key={branch.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-mint bg-white px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-black">{branch.name}</p>
                    {branch.address && <p className="text-sm text-black/60">{branch.address}</p>}
                    {branch.google_maps_url && (
                      <a
                        href={branch.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-mint underline"
                      >
                        View on map
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startEdit(branch)}
                      className="text-xs font-bold uppercase tracking-wide text-black/50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(branch)}
                      className="text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove branch"
                    >
                      &times;
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-mint pt-4">
          <FormField
            id="branch-new-name"
            label="Branch name"
            value={newForm.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="e.g. Downtown Branch"
          />
          <FormField
            id="branch-new-address"
            label="Branch address"
            optional
            value={newForm.address}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewForm((current) => ({ ...current, address: event.target.value }))
            }
          />
          <FormField
            id="branch-new-maps"
            label="Branch location (Google Maps link)"
            optional
            type="url"
            value={newForm.google_maps_url}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setNewForm((current) => ({ ...current, google_maps_url: event.target.value }))
            }
          />

          {actionError && <p className="text-sm text-red-400">{actionError}</p>}

          <SmallButton type="submit" variant="primary" disabled={busy || !newForm.name.trim()}>
            Add branch
          </SmallButton>
        </form>
      </div>
    </ModalShell>
  );
}
