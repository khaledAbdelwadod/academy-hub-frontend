/** An academy manager's own "Academy Profile" tab: view details, edit contact/description fields. */

import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import type { ManagerAcademyProfile } from "../api/managerAcademyApi";
import { fetchMyAcademyProfile, updateMyAcademyProfile } from "../api/managerAcademyApi";
import { AuthButton } from "../components/ui/AuthButton";
import { FormField } from "../components/ui/FormField";
import { ReadOnlyField } from "../components/ui/ReadOnlyField";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: ManagerAcademyProfile };

type SaveState = { status: "idle" } | { status: "saving" } | { status: "saved" } | { status: "error"; message: string };

export function AcademyProfilePage(): ReactElement {
  const subdomain = getAcademySubdomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    if (!subdomain) {
      return;
    }
    fetchMyAcademyProfile(subdomain)
      .then((profile) => setState({ status: "ready", profile }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load the academy profile.";
        logger.error("Failed to load academy profile", { error: message });
        setState({ status: "error", message });
      });
  }, [subdomain]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!subdomain) {
      return;
    }
    const data = new FormData(event.currentTarget);

    setSaveState({ status: "saving" });
    updateMyAcademyProfile(subdomain, {
      contact_email: String(data.get("contact_email") ?? ""),
      contact_phone: String(data.get("contact_phone") ?? ""),
      address: String(data.get("address") ?? ""),
      google_maps_url: String(data.get("google_maps_url") ?? ""),
      description: String(data.get("description") ?? ""),
    })
      .then((profile) => {
        setState({ status: "ready", profile });
        setSaveState({ status: "saved" });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not save the academy profile.";
        logger.error("Failed to save academy profile", { error: message });
        setSaveState({ status: "error", message });
      });
  }

  if (state.status === "loading") {
    return <div className="min-h-full" />;
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <p className="text-white/60">{state.message}</p>
      </div>
    );
  }

  const { profile } = state;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-8">
      <div className="rounded-[22px] border border-white/15 bg-black/45 p-6 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
        <h1 className="mb-6 text-2xl font-extrabold text-white">Academy Profile</h1>

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

          <FormField id="ap-address" name="address" label="Address" optional defaultValue={profile.address} />
          <FormField
            id="ap-maps"
            name="google_maps_url"
            label="Google Maps link"
            optional
            type="url"
            defaultValue={profile.google_maps_url}
          />
          <FormField
            id="ap-description"
            name="description"
            label="Description"
            optional
            defaultValue={profile.description}
          />

          {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}
          {saveState.status === "saved" && <p className="text-sm text-teal">Saved.</p>}

          <AuthButton type="submit" fullWidth={false} disabled={saveState.status === "saving"}>
            {saveState.status === "saving" ? "Saving…" : "Save changes"}
          </AuthButton>
        </form>
      </div>
    </div>
  );
}
