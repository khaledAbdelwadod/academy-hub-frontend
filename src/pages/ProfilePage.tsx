/** The signed-in user's own profile: editable fields plus read-only account info. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { AuthUser } from "../api/authApi";
import { fetchProfile } from "../api/authApi";
import { AuthButton } from "../components/ui/AuthButton";
import { FormField } from "../components/ui/FormField";
import { ReadOnlyField } from "../components/ui/ReadOnlyField";
import { logger } from "../utils/logger";

type ProfileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: AuthUser };

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function ProfilePage(): ReactElement {
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchProfile()
      .then((profile) => {
        if (!cancelled) {
          setState({ status: "ready", profile });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load your profile.";
        logger.error("Failed to load profile", { error: message });
        if (!cancelled) {
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p className="px-6 py-16 text-center text-white/70">Loading your profile…</p>;
  }
  if (state.status === "error") {
    return <p className="px-6 py-16 text-center text-red-400">{state.message}</p>;
  }

  const { profile } = state;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-[22px] border border-white/15 bg-black/45 p-8 backdrop-blur-2xl backdrop-saturate-150">
        <h1 className="mb-6 text-2xl font-extrabold text-white">My Profile</h1>

        <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
          <div className="grid grid-cols-3 gap-3">
            <FormField id="pf-first" name="first_name" label="First name" defaultValue={profile.first_name} />
            <FormField
              id="pf-middle"
              name="middle_name"
              label="Middle name"
              optional
              defaultValue={profile.middle_name}
            />
            <FormField id="pf-last" name="last_name" label="Last name" defaultValue={profile.last_name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField id="pf-phone" name="phone" label="Phone number" defaultValue={profile.phone} />
            <FormField
              id="pf-dob"
              name="date_of_birth"
              label="Date of birth"
              type="date"
              defaultValue={profile.date_of_birth}
            />
          </div>

          <AuthButton type="submit" fullWidth={false}>
            Save changes
          </AuthButton>
        </form>

        <div className="mt-8 border-t border-white/15 pt-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/50">Account info</h2>
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField label="Email" value={profile.email} />
            <ReadOnlyField label="Email verified" value={yesNo(profile.email_verified)} />
            <ReadOnlyField label="Phone verified" value={yesNo(profile.phone_verified)} />
            <ReadOnlyField label="Account active" value={yesNo(profile.is_active)} />
            <ReadOnlyField label="Staff access" value={yesNo(profile.is_staff)} />
            <ReadOnlyField label="Super admin" value={yesNo(profile.is_superuser)} />
            <ReadOnlyField label="Member since" value={formatDateTime(profile.created_at)} />
            <ReadOnlyField label="Last login" value={formatDateTime(profile.last_login)} />
          </div>
        </div>
      </div>
    </div>
  );
}
