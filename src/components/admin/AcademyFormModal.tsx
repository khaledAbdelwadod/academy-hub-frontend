/** A modal for the superadmin to create a new academy or edit an existing one, including its branches. */

import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { createAdminBranch, deleteAdminBranch, listAdminBranches, updateAdminBranch } from "../../api/adminBranchApi";
import type { AdminAcademy } from "../../api/adminAcademiesApi";
import { createAcademy, updateAcademy } from "../../api/adminAcademiesApi";
import type { Branch } from "../../api/branchApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { ReadOnlyField } from "../ui/ReadOnlyField";
import { BranchManager } from "./BranchManager";

interface AcademyFormModalProps {
  /** The academy being edited, or null to create a new one. */
  academy: AdminAcademy | null;
  onClose: () => void;
  onSaved: (academy: AdminAcademy) => void;
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export function AcademyFormModal({ academy, onClose, onSaved }: AcademyFormModalProps): ReactElement {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const [createdAcademy, setCreatedAcademy] = useState<AdminAcademy | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const isCreate = academy === null;
  const currentAcademy = academy ?? createdAcademy;
  const isPostCreate = isCreate && createdAcademy !== null;

  function reloadBranches(academyId: number): void {
    listAdminBranches(academyId)
      .then((result) => setBranches(result))
      .catch((error: unknown) => {
        logger.error("Failed to load branches", { error: error instanceof Error ? error.message : error });
      });
  }

  useEffect(() => {
    if (currentAcademy) {
      reloadBranches(currentAcademy.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the academy identity changes
  }, [currentAcademy?.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isPostCreate) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const fields = {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      contact_email: String(data.get("contact_email") ?? ""),
      contact_phone: String(data.get("contact_phone") ?? ""),
      is_active: data.get("is_active") === "on",
    };

    setState({ status: "saving" });

    if (isCreate) {
      createAcademy({ ...fields, subdomain: String(data.get("subdomain") ?? "") })
        .then((saved) => {
          setState({ status: "idle" });
          setCreatedAcademy(saved);
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Could not create that academy.";
          logger.error("Admin academy save failed", { error: message });
          setState({ status: "error", message });
        });
      return;
    }

    updateAcademy(academy.id, fields)
      .then((saved) => {
        setState({ status: "idle" });
        onSaved(saved);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not save that academy.";
        logger.error("Admin academy save failed", { error: message });
        setState({ status: "error", message });
      });
  }

  return (
    <ModalShell
      title={isCreate ? "Create Academy" : "Edit Academy"}
      onClose={onClose}
      maxWidthClassName="max-w-4xl"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              id="ac-name"
              name="name"
              label="Academy name"
              defaultValue={academy?.name}
              required
              disabled={isPostCreate}
            />
            {isCreate ? (
              <FormField
                id="ac-subdomain"
                name="subdomain"
                label="Subdomain"
                placeholder="football-heros"
                required
                disabled={isPostCreate}
              />
            ) : (
              <ReadOnlyField label="Subdomain" value={`${academy?.subdomain}.academy-hub.net`} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              id="ac-email"
              name="contact_email"
              label="Contact email"
              type="email"
              defaultValue={academy?.contact_email}
              disabled={isPostCreate}
            />
            <FormField
              id="ac-phone"
              name="contact_phone"
              label="Contact phone"
              defaultValue={academy?.contact_phone}
              disabled={isPostCreate}
            />
          </div>

          <FormField
            id="ac-description"
            name="description"
            label="Description"
            optional
            defaultValue={academy?.description}
            disabled={isPostCreate}
          />

          <label className="flex items-center gap-2 text-sm text-black/80">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={academy?.is_active ?? true}
              disabled={isPostCreate}
              className="size-3.5 accent-coral"
            />
            Active
          </label>

          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

          {isPostCreate ? (
            <AuthButton
              type="button"
              fullWidth={false}
              onClick={() => createdAcademy && onSaved(createdAcademy)}
            >
              Done
            </AuthButton>
          ) : (
            <AuthButton type="submit" fullWidth={false} disabled={state.status === "saving"}>
              {state.status === "saving" ? "Saving…" : isCreate ? "Create academy" : "Save changes"}
            </AuthButton>
          )}
        </form>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold text-black">Locations</h2>

          {!currentAcademy && (
            <p className="rounded-lg border border-mint bg-white px-3 py-2 text-sm text-black/60">
              Create the academy first, then add its locations here.
            </p>
          )}

          {currentAcademy && branches === null && <p className="text-sm text-gray-500">Loading…</p>}

          {currentAcademy && branches !== null && (
            <BranchManager
              branches={branches}
              onAdd={(data) => createAdminBranch(currentAcademy.id, data)}
              onUpdate={(id, data) => updateAdminBranch(currentAcademy.id, id, data)}
              onDelete={(id) => deleteAdminBranch(currentAcademy.id, id)}
              onChanged={() => reloadBranches(currentAcademy.id)}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
}
