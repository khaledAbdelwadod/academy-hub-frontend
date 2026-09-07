/** A modal showing the signed-in user's own profile: editable fields plus read-only account info. */

import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import type { AuthUser } from "../../api/authApi";
import { fetchProfile, updateProfile } from "../../api/authApi";
import { useAuth } from "../../state/AuthContext";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ReadOnlyField } from "../ui/ReadOnlyField";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: AuthUser };

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

interface ProfileModalProps {
  onClose: () => void;
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function ProfileModal({ onClose }: ProfileModalProps): ReactElement {
  const { signIn } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    fetchProfile()
      .then((profile) => {
        if (!cancelled) {
          setLoadState({ status: "ready", profile });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load your profile.";
        logger.error("Failed to load profile", { error: message });
        if (!cancelled) {
          setLoadState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setSaveState({ status: "saving" });
    updateProfile({
      first_name: String(data.get("first_name") ?? ""),
      middle_name: String(data.get("middle_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      date_of_birth: String(data.get("date_of_birth") ?? ""),
    })
      .then((updated) => {
        setLoadState({ status: "ready", profile: updated });
        setSaveState({ status: "idle" });
        signIn(updated);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not save your changes.";
        logger.error("Failed to save profile", { error: message });
        setSaveState({ status: "error", message });
      });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-10">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
      />

      <div className="relative w-full max-w-3xl rounded-[22px] border border-white/15 bg-black/70 p-8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-150">
        <button
          type="button"
          aria-label="Close profile"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>

        <h1 className="mb-6 text-2xl font-extrabold text-white">My Profile</h1>

        {loadState.status === "loading" && <p className="py-10 text-center text-white/70">Loading your profile…</p>}
        {loadState.status === "error" && <p className="py-10 text-center text-red-400">{loadState.message}</p>}

        {loadState.status === "ready" && (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  id="pf-first"
                  name="first_name"
                  label="First name"
                  defaultValue={loadState.profile.first_name}
                  required
                />
                <FormField
                  id="pf-middle"
                  name="middle_name"
                  label="Middle name"
                  optional
                  defaultValue={loadState.profile.middle_name}
                />
                <FormField
                  id="pf-last"
                  name="last_name"
                  label="Last name"
                  defaultValue={loadState.profile.last_name}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="pf-phone"
                  name="phone"
                  label="Phone number"
                  defaultValue={loadState.profile.phone}
                  required
                />
                <FormField
                  id="pf-dob"
                  name="date_of_birth"
                  label="Date of birth"
                  type="date"
                  defaultValue={loadState.profile.date_of_birth}
                  required
                />
              </div>

              {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}

              <AuthButton type="submit" fullWidth={false} disabled={saveState.status === "saving"}>
                {saveState.status === "saving" ? "Saving…" : "Save changes"}
              </AuthButton>
            </form>

            <div className="mt-8 border-t border-white/15 pt-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/50">Account info</h2>
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="Email" value={loadState.profile.email} />
                <ReadOnlyField label="Email verified" value={yesNo(loadState.profile.email_verified)} />
                <ReadOnlyField label="Phone verified" value={yesNo(loadState.profile.phone_verified)} />
                <ReadOnlyField label="Account active" value={yesNo(loadState.profile.is_active)} />
                <ReadOnlyField label="Staff access" value={yesNo(loadState.profile.is_staff)} />
                <ReadOnlyField label="Super admin" value={yesNo(loadState.profile.is_superuser)} />
                <ReadOnlyField label="Member since" value={formatDateTime(loadState.profile.created_at)} />
                <ReadOnlyField label="Last login" value={formatDateTime(loadState.profile.last_login)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
