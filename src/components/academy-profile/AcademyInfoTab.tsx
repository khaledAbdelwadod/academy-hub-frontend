/** The Academy Profile "Info" tab: read-only name/subdomain plus editable contact details and description. */

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

import type { ManagerAcademyProfile } from "../../api/managerAcademyApi";
import { updateMyAcademyProfile } from "../../api/managerAcademyApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ReadOnlyField } from "../ui/ReadOnlyField";

interface AcademyInfoTabProps {
  subdomain: string;
  profile: ManagerAcademyProfile;
  onSaved: (profile: ManagerAcademyProfile) => void;
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function AcademyInfoTab({ subdomain, profile, onSaved }: AcademyInfoTabProps): ReactElement {
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSaveState({ status: "saving" });
    updateMyAcademyProfile(subdomain, {
      contact_email: String(data.get("contact_email") ?? ""),
      contact_phone: String(data.get("contact_phone") ?? ""),
      description: String(data.get("description") ?? ""),
    })
      .then((updated) => {
        onSaved(updated);
        setSaveState({ status: "saved" });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not save the academy profile.";
        logger.error("Failed to save academy profile", { error: message });
        setSaveState({ status: "error", message });
      });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReadOnlyField label="Academy name" value={profile.name} />
        <ReadOnlyField label="Subdomain" value={`${profile.subdomain}.academy-hub.net`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          id="ap-email"
          name="contact_email"
          label="Contact email"
          type="email"
          defaultValue={profile.contact_email}
        />
        <FormField id="ap-phone" name="contact_phone" label="Contact phone" defaultValue={profile.contact_phone} />
      </div>

      <FormField id="ap-description" name="description" label="Description" optional defaultValue={profile.description} />

      {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}
      {saveState.status === "saved" && <p className="text-sm text-teal">Saved.</p>}

      <AuthButton type="submit" fullWidth={false} disabled={saveState.status === "saving"}>
        {saveState.status === "saving" ? "Saving…" : "Save changes"}
      </AuthButton>
    </form>
  );
}
