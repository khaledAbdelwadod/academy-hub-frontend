/** A compact "..." menu for per-row actions in the Academies table. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { AdminAcademy } from "../../api/adminAcademiesApi";

interface AcademyRowActionsMenuProps {
  academy: AdminAcademy;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function AcademyRowActionsMenu({
  academy,
  onEdit,
  onToggleActive,
  onDelete,
}: AcademyRowActionsMenuProps): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Row actions"
        onClick={() => setOpen((current) => !current)}
        className="flex size-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
          <circle cx="10" cy="4" r="1.6" />
          <circle cx="10" cy="10" r="1.6" />
          <circle cx="10" cy="16" r="1.6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 overflow-hidden rounded-xl border border-white/15 bg-black/45 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
            <button
              type="button"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="block w-full px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleActive();
                setOpen(false);
              }}
              className="block w-full px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {academy.is_active ? "Deactivate" : "Reactivate"}
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="block w-full px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-red-300 transition-colors hover:bg-red-400/10"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
