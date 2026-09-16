/** An academy manager's own "Academy Profile" tab: edit contact/description fields, upload media, manage locations. */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Branch } from "../api/branchApi";
import { listBranches } from "../api/branchApi";
import type { JoinRequestField } from "../api/joinRequestApi";
import { listJoinRequestFields } from "../api/joinRequestApi";
import type { ManagerAcademyProfile } from "../api/managerAcademyApi";
import {
  fetchMyAcademyProfile,
  updateMyAcademyProfile,
  uploadMyAcademyLegalDocument,
  uploadMyAcademyLoginVideo,
  uploadMyAcademyLogo,
} from "../api/managerAcademyApi";
import { BranchBuilderModal } from "../components/admin/BranchBuilderModal";
import { JoinRequestFormBuilderModal } from "../components/admin/JoinRequestFormBuilderModal";
import { AuthButton } from "../components/ui/AuthButton";
import { FormField } from "../components/ui/FormField";
import { ReadOnlyField } from "../components/ui/ReadOnlyField";
import { SmallButton } from "../components/ui/SmallButton";
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
      <span className="text-xs font-bold uppercase tracking-wider text-black/50">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {currentUrl ? (
          <a href={currentUrl} target="_blank" rel="noreferrer" className="text-xs text-teal underline">
            View current file
          </a>
        ) : (
          <span className="text-xs text-gray-400">Not uploaded</span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-mint bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-black/80 transition-colors hover:bg-mint/15 disabled:cursor-not-allowed disabled:opacity-60"
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
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [joinFields, setJoinFields] = useState<JoinRequestField[] | null>(null);
  const [showBranchBuilder, setShowBranchBuilder] = useState(false);
  const [branches, setBranches] = useState<Branch[] | null>(null);

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

  function reloadJoinFields(): void {
    if (!subdomain) return;
    listJoinRequestFields(subdomain)
      .then((fields) => setJoinFields(fields))
      .catch((error: unknown) => {
        logger.error("Failed to load join-request fields", {
          error: error instanceof Error ? error.message : error,
        });
      });
  }

  useEffect(() => {
    reloadJoinFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
  }, [subdomain]);

  function reloadBranches(): void {
    if (!subdomain) return;
    listBranches(subdomain)
      .then((result) => setBranches(result))
      .catch((error: unknown) => {
        logger.error("Failed to load branches", { error: error instanceof Error ? error.message : error });
      });
  }

  useEffect(() => {
    reloadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount for this subdomain
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
        <p className="text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{state.message}</p>
      </div>
    );
  }

  const { profile } = state;

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-8 lg:grid-cols-3">
      <div className="rounded-[22px] border border-mint bg-white/40 p-6 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
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
          <div className="mt-6 flex flex-col gap-4 border-t border-mint pt-6">
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

      {subdomain && (
        <div className="rounded-[22px] border border-mint bg-white/40 p-6 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-black">Locations</h2>
            {branches !== null && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                  branches.length > 0 || profile.address ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
                }`}
              >
                {(() => {
                  const total = branches ? branches.length + (profile.address ? 1 : 0) : profile.address ? 1 : 0;
                  return total > 0 ? `${total} location${total === 1 ? "" : "s"}` : "None";
                })()}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/50">Main location</p>
          {profile.address ? (
            <div className="mt-1 flex items-start gap-2 text-sm text-black/80">
              <span className="mt-0.5 text-mint">•</span>
              <span>
                {profile.address}
                {profile.google_maps_url && (
                  <>
                    {" "}
                    <a
                      href={profile.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-mint underline"
                    >
                      View on map
                    </a>
                  </>
                )}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-black/60">Not set yet - a superadmin sets this when creating the academy.</p>
          )}

          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-black/50">Additional locations</p>
          {branches === null && <p className="mt-1 text-sm text-black/60">Loading…</p>}

          {branches !== null && branches.length === 0 && (
            <p className="mt-1 text-sm text-black/60">None yet - add another training location below.</p>
          )}

          {branches !== null && branches.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1.5">
              {branches.map((branch) => (
                <li key={branch.id} className="flex items-start gap-2 text-sm text-black/80">
                  <span className="mt-0.5 text-mint">•</span>
                  <span>
                    {branch.name}
                    {branch.address && <span className="ml-1.5 text-xs text-black/40">{branch.address}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <SmallButton variant="primary" onClick={() => setShowBranchBuilder(true)} className="mt-4">
            Add location
          </SmallButton>
        </div>
      )}

      {subdomain && (
        <div className="rounded-[22px] border border-mint bg-white/40 p-6 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-black">Join Request Form</h2>
            {joinFields !== null && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                  joinFields.length > 0 ? "bg-teal/15 text-teal" : "bg-gray-100 text-gray-500"
                }`}
              >
                {joinFields.length > 0 ? `${joinFields.length} field${joinFields.length === 1 ? "" : "s"}` : "Off"}
              </span>
            )}
          </div>

          {joinFields === null && <p className="mt-1 text-sm text-black/60">Loading…</p>}

          {joinFields !== null && joinFields.length === 0 && (
            <p className="mt-1 text-sm text-black/60">
              Define the questions someone must answer to request joining your academy. Leave it empty to
              show the default &quot;contact us&quot; message instead.
            </p>
          )}

          {joinFields !== null && joinFields.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {[...joinFields]
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <li key={field.id} className="flex items-start gap-2 text-sm text-black/80">
                    <span className="mt-0.5 text-mint">•</span>
                    <span>
                      {field.label}
                      {!field.required && <span className="ml-1.5 text-xs text-black/40">(optional)</span>}
                    </span>
                  </li>
                ))}
            </ul>
          )}

          <SmallButton variant="primary" onClick={() => setShowFormBuilder(true)} className="mt-4">
            Edit form
          </SmallButton>
        </div>
      )}

      {showFormBuilder && subdomain && (
        <JoinRequestFormBuilderModal
          subdomain={subdomain}
          onClose={() => {
            setShowFormBuilder(false);
            reloadJoinFields();
          }}
        />
      )}

      {showBranchBuilder && subdomain && (
        <BranchBuilderModal
          subdomain={subdomain}
          onClose={() => {
            setShowBranchBuilder(false);
            reloadBranches();
          }}
        />
      )}
    </div>
  );
}
