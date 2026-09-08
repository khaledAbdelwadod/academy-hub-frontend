/** A generic "upload/replace this file" control, used for an academy's logo/document/video. */

import { useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

interface AcademyFileFieldProps {
  label: string;
  currentUrl: string | null;
  accept: string;
  onUpload: (file: File) => Promise<void>;
}

export function AcademyFileField({ label, currentUrl, accept, onUpload }: AcademyFileFieldProps): ReactElement {
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
