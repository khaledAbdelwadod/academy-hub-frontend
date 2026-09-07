/** A modal showing the signed-in user's read-only account info, separate from My Profile. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import type { AuthUser } from "../../api/authApi";
import { fetchProfile } from "../../api/authApi";
import { logger } from "../../utils/logger";
import { ReadOnlyField } from "../ui/ReadOnlyField";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: AuthUser };

interface AccountInfoModalProps {
  onClose: () => void;
}

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Never";
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function AccountInfoModal({ onClose }: AccountInfoModalProps): ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchProfile()
      .then((profile) => {
        if (!cancelled) {
          setState({ status: "ready", profile });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load your account info.";
        logger.error("Failed to load account info", { error: message });
        if (!cancelled) {
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-10">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default" />

      <div className="relative w-full max-w-xl rounded-[22px] border border-white/15 bg-black/70 p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>

        <h1 className="mb-6 text-2xl font-extrabold text-white">Account Info</h1>

        {state.status === "loading" && <p className="py-10 text-center text-white/70">Loading…</p>}
        {state.status === "error" && <p className="py-10 text-center text-red-400">{state.message}</p>}

        {state.status === "ready" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Email" value={state.profile.email} />
            <ReadOnlyField label="Email verified" value={yesNo(state.profile.email_verified)} />
            <ReadOnlyField label="Phone verified" value={yesNo(state.profile.phone_verified)} />
            <ReadOnlyField label="Account active" value={yesNo(state.profile.is_active)} />
            <ReadOnlyField label="Staff access" value={yesNo(state.profile.is_staff)} />
            <ReadOnlyField label="Super admin" value={yesNo(state.profile.is_superuser)} />
            <ReadOnlyField label="Member since" value={formatDateTime(state.profile.created_at)} />
            <ReadOnlyField label="Last login" value={formatDateTime(state.profile.last_login)} />
          </div>
        )}
      </div>
    </div>
  );
}
