/** Shows the current avatar and lets the user pick a new image to upload immediately. */

import { useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import { uploadAvatar } from "../../api/authApi";
import { useAuth } from "../../state/AuthContext";
import { logger } from "../../utils/logger";

type UploadState = { status: "idle" } | { status: "uploading" } | { status: "error"; message: string };

interface AvatarUploaderProps {
  initialAvatarUrl: string | null;
  initials: string;
}

export function AvatarUploader({ initialAvatarUrl, initials }: AvatarUploaderProps): ReactElement {
  const { user, signIn } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setState({ status: "uploading" });
    uploadAvatar(file)
      .then((updated) => {
        setState({ status: "idle" });
        setAvatarUrl(updated.avatar);
        if (user) {
          signIn({ ...user, avatar: updated.avatar });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not upload that image.";
        logger.error("Avatar upload failed", { error: message });
        setState({ status: "error", message });
      });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sand to-coral text-lg font-bold text-white">
        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initials}
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={state.status === "uploading"}
          className="w-fit rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "uploading" ? "Uploading…" : "Change avatar"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        {state.status === "error" && <p className="text-xs text-red-400">{state.message}</p>}
      </div>
    </div>
  );
}
