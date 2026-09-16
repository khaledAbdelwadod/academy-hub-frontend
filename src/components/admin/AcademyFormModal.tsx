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
    const data = new FormData(event.currentTarget);
    const fields = {
      name: String(data.get("name") ?? ""),
      address: String(data.get("address") ?? ""),
      google_maps_url: String(data.get("google_maps_url") ?? ""),
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
      maxWidthClassName="max-w-2xl"
    >
      {!isPostCreate && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField id="ac-name" name="name" label="Academy name" defaultValue={academy?.name} required />
            {isCreate ? (
              <FormField
                id="ac-subdomain"
                name="subdomain"
                label="Subdomain"
                placeholder="football-heros"
                required
              />
            ) : (
              <ReadOnlyField label="Subdomain" value={`${academy?.subdomain}.academy-hub.net`} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField id="ac-email" name="contact_email" label="Contact email" type="email" defaultValue={academy?.contact_email} />
            <FormField id="ac-phone" name="contact_phone" label="Contact phone" defaultValue={academy?.contact_phone} />
          </div>

          <FormField id="ac-address" name="address" label="Address" optional defaultValue={academy?.address} />
          <FormField
            id="ac-maps"
            name="google_maps_url"
            label="Google Maps link"
            optional
            type="url"
            defaultValue={academy?.google_maps_url}
          />
          <FormField
            id="ac-description"
            name="description"
            label="Description"
            optional
            defaultValue={academy?.description}
          />

          <label className="flex items-center gap-2 text-sm text-black/80">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={academy?.is_active ?? true}
              className="size-3.5 accent-coral"
            />
            Active
          </label>

          {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

          <AuthButton type="submit" fullWidth={false} disabled={state.status === "saving"}>
            {state.status === "saving" ? "Saving…" : isCreate ? "Create academy" : "Save changes"}
          </AuthButton>
        </form>
      )}

      {currentAcademy && (
        <div className={isPostCreate ? "flex flex-col gap-4" : "mt-6 flex flex-col gap-4 border-t border-mint pt-6"}>
          {isPostCreate && <p className="text-sm text-teal">Academy created. Add its locations below.</p>}
          <h2 className="text-lg font-extrabold text-black">Branches</h2>
          {branches === null ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <BranchManager
              branches={branches}
              onAdd={(data) => createAdminBranch(currentAcademy.id, data)}
              onUpdate={(id, data) => updateAdminBranch(currentAcademy.id, id, data)}
              onDelete={(id) => deleteAdminBranch(currentAcademy.id, id)}
              onChanged={() => reloadBranches(currentAcademy.id)}
            />
          )}
          {isPostCreate && (
            <AuthButton type="button" fullWidth={false} onClick={() => onSaved(currentAcademy)}>
              Done
            </AuthButton>
          )}
        </div>
      )}
    </ModalShell>
  );
}
