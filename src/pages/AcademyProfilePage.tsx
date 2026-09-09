/** An academy manager's own "Academy Profile" tab: view details, edit contact/description fields, upload media. */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { ManagerAcademyProfile } from "../api/managerAcademyApi";
import {
  fetchMyAcademyProfile,
  updateMyAcademyProfile,
  uploadMyAcademyLegalDocument,
  uploadMyAcademyLoginVideo,
  uploadMyAcademyLogo,
} from "../api/managerAcademyApi";
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

interface AcademyFileFieldProps {
  label: string;
  currentUrl: string | null;
  accept: string;
  onUpload: (file: File) => Promise<void>;
}

/** A generic "upload/replace this file" control for the academy's logo/document/video. */
function AcademyFileField({ label, currentUrl, accept, onUpload }: AcademyFileFieldProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    onUpload(file)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Upload failed.");
      })
      .finally(() => setUploading(false));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-white/50">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {currentUrl ? (
          <a href={currentUrl} target="_blank" rel="noreferrer" className="text-xs text-teal underline">
            View current file
          </a>
        ) : (
          <span className="text-xs text-white/40">Not uploaded</span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

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

        {subdomain && (
          <div className="mt-8 flex flex-col gap-4 border-t border-white/15 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Media</h2>
            <AcademyFileField
              label="Logo"
              currentUrl={profile.logo}
              accept="image/*"
              onUpload={(file) =>
                uploadMyAcademyLogo(subdomain, file).then((updated) => setState({ status: "ready", profile: updated }))
              }
            />
            <AcademyFileField
              label="Legal document"
              currentUrl={profile.legal_document}
              accept="application/pdf,image/*"
              onUpload={(file) =>
                uploadMyAcademyLegalDocument(subdomain, file).then((updated) =>
                  setState({ status: "ready", profile: updated }),
                )
              }
            />
            <AcademyFileField
              label="Login page background video"
              currentUrl={profile.login_background_video}
              accept="video/mp4,video/webm,video/quicktime"
              onUpload={(file) =>
                uploadMyAcademyLoginVideo(subdomain, file).then((updated) =>
                  setState({ status: "ready", profile: updated }),
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
