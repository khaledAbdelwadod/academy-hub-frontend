/** A modal for an academy manager to build their "request to join" form: add, name, reorder, and remove fields. */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { JoinRequestField } from "../../api/joinRequestApi";
import {
  createJoinRequestField,
  deleteJoinRequestField,
  listJoinRequestFields,
  updateJoinRequestField,
} from "../../api/joinRequestApi";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { SmallButton } from "../ui/SmallButton";

interface JoinRequestFormBuilderModalProps {
  subdomain: string;
  onClose: () => void;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; fields: JoinRequestField[] };

export function JoinRequestFormBuilderModal({ subdomain, onClose }: JoinRequestFormBuilderModalProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [newLabel, setNewLabel] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reload(): void {
    listJoinRequestFields(subdomain)
      .then((fields) => setState({ status: "ready", fields }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load the form.";
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
  }, [subdomain]);

  function handleAdd(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const label = newLabel.trim();
    if (!label || state.status !== "ready") return;

    const nextOrder = state.fields.length > 0 ? Math.max(...state.fields.map((f) => f.order)) + 1 : 1;
    setBusy(true);
    setActionError(null);
    createJoinRequestField(subdomain, { label, required: newRequired, order: nextOrder })
      .then(() => {
        setNewLabel("");
        setNewRequired(true);
        reload();
      })
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not add that field.");
      })
      .finally(() => setBusy(false));
  }

  function handleToggleRequired(field: JoinRequestField): void {
    setBusy(true);
    setActionError(null);
    updateJoinRequestField(subdomain, field.id, { required: !field.required })
      .then(() => reload())
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not update that field.");
      })
      .finally(() => setBusy(false));
  }

  function handleMove(field: JoinRequestField, direction: "up" | "down"): void {
    if (state.status !== "ready") return;
    const sorted = [...state.fields].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((f) => f.id === field.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const neighbor = sorted[swapIndex];
    if (!neighbor) return;

    setBusy(true);
    setActionError(null);
    Promise.all([
      updateJoinRequestField(subdomain, field.id, { order: neighbor.order }),
      updateJoinRequestField(subdomain, neighbor.id, { order: field.order }),
    ])
      .then(() => reload())
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not reorder that field.");
      })
      .finally(() => setBusy(false));
  }

  function handleDelete(field: JoinRequestField): void {
    if (!window.confirm(`Remove "${field.label}" from the join-request form?`)) return;

    setBusy(true);
    setActionError(null);
    deleteJoinRequestField(subdomain, field.id)
      .then(() => reload())
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not remove that field.");
      })
      .finally(() => setBusy(false));
  }

  const fields = state.status === "ready" ? [...state.fields].sort((a, b) => a.order - b.order) : [];

  return (
    <ModalShell title="Join Request Form" onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-black/60">
          Anyone who isn&apos;t a member yet and visits your academy will see this form instead of the default
          &quot;contact us&quot; message - as soon as it has at least one field.
        </p>
        <p className="rounded-lg border border-mint bg-white px-3 py-2 text-xs text-black/50">
          Name, email, phone, and date of birth are pulled automatically from the applicant&apos;s account -
          no need to add fields for those, they&apos;ll already show up in Membership Requests.
        </p>

        {state.status === "loading" && <p className="text-sm text-gray-500">Loading…</p>}
        {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

        {state.status === "ready" && fields.length === 0 && (
          <p className="rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black/60">
            No fields yet - add one below to turn this form on.
          </p>
        )}

        {fields.length > 0 && (
          <ul className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="flex items-center gap-2 rounded-lg border border-mint bg-white px-3 py-2"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => handleMove(field, "up")}
                    className="text-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === fields.length - 1}
                    onClick={() => handleMove(field, "down")}
                    className="text-black/40 hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>

                <span className="flex-1 text-sm text-black">{field.label}</span>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggleRequired(field)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    field.required ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {field.required ? "Required" : "Optional"}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(field)}
                  className="text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Remove field"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-mint pt-4">
          <FormField
            id="jrf-new-label"
            label="New field"
            value={newLabel}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setNewLabel(event.target.value)}
            placeholder="e.g. Why do you want to join?"
          />
          <label className="flex items-center gap-2 text-sm text-black/70">
            <input
              type="checkbox"
              checked={newRequired}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setNewRequired(event.target.checked)}
              className="size-3.5 accent-mint"
            />
            Required
          </label>

          {actionError && <p className="text-sm text-red-400">{actionError}</p>}

          <SmallButton type="submit" variant="primary" disabled={busy || !newLabel.trim()}>
            Add field
          </SmallButton>
        </form>
      </div>
    </ModalShell>
  );
}
