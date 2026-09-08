/** A modal for the superadmin to create a new academy or edit an existing one. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import type { AdminAcademy } from "../../api/adminAcademiesApi";
import {
  createAcademy,
  updateAcademy,
  uploadAcademyLegalDocument,
  uploadAcademyLoginVideo,
  uploadAcademyLogo,
} from "../../api/adminAcademiesApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { ReadOnlyField } from "../ui/ReadOnlyField";
import { AcademyFileField } from "./AcademyFileField";

interface AcademyFormModalProps {
  /** The academy being edited, or null to create a new one. */
  academy: AdminAcademy | null;
  onClose: () => void;
  onSaved: (academy: AdminAcademy) => void;
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export function AcademyFormModal({ academy, onClose, onSaved }: AcademyFormModalProps): ReactElement {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const [current, setCurrent] = useState<AdminAcademy | null>(academy);
  const isCreate = academy === null;

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
    const request = isCreate
      ? createAcademy({ ...fields, subdomain: String(data.get("subdomain") ?? "") })
      : updateAcademy(academy.id, fields);

    request
      .then((saved) => {
        setState({ status: "idle" });
        setCurrent(saved);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField id="ac-name" name="name" label="Academy name" defaultValue={current?.name} required />
          {isCreate ? (
            <FormField
              id="ac-subdomain"
              name="subdomain"
              label="Subdomain"
              placeholder="football-heros"
              required
            />
          ) : (
            <ReadOnlyField label="Subdomain" value={`${current?.subdomain}.academy-hub.net`} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField id="ac-email" name="contact_email" label="Contact email" type="email" defaultValue={current?.contact_email} />
          <FormField id="ac-phone" name="contact_phone" label="Contact phone" defaultValue={current?.contact_phone} />
        </div>

        <FormField id="ac-address" name="address" label="Address" optional defaultValue={current?.address} />
        <FormField
          id="ac-maps"
          name="google_maps_url"
          label="Google Maps link"
          optional
          type="url"
          defaultValue={current?.google_maps_url}
        />
        <FormField
          id="ac-description"
          name="description"
          label="Description"
          optional
          defaultValue={current?.description}
        />

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={current?.is_active ?? true}
            className="size-3.5 accent-coral"
          />
          Active
        </label>

        {state.status === "error" && <p className="text-sm text-red-400">{state.message}</p>}

        <AuthButton type="submit" fullWidth={false} disabled={state.status === "saving"}>
          {state.status === "saving" ? "Saving…" : isCreate ? "Create academy" : "Save changes"}
        </AuthButton>
      </form>

      {!isCreate && current && (
        <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Media</h2>
          <AcademyFileField
            label="Logo"
            currentUrl={current.logo}
            accept="image/*"
            onUpload={(file) => uploadAcademyLogo(current.id, file).then((updated) => setCurrent(updated))}
          />
          <AcademyFileField
            label="Legal document"
            currentUrl={current.legal_document}
            accept="application/pdf,image/*"
            onUpload={(file) =>
              uploadAcademyLegalDocument(current.id, file).then((updated) => setCurrent(updated))
            }
          />
          <AcademyFileField
            label="Login page background video"
            currentUrl={current.login_background_video}
            accept="video/mp4,video/webm,video/quicktime"
            onUpload={(file) => uploadAcademyLoginVideo(current.id, file).then((updated) => setCurrent(updated))}
          />
        </div>
      )}
    </ModalShell>
  );
}
