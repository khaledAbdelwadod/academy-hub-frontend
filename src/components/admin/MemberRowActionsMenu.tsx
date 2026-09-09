/** A compact "..." menu for per-row actions in the Academy Members table. */

import { useState } from "react";
import type { ReactElement } from "react";

import type { ManagerMemberRow } from "../../api/managerMembersApi";

interface MemberRowActionsMenuProps {
  member: ManagerMemberRow;
  onToggleStatus: () => void;
  onRemove: () => void;
}

export function MemberRowActionsMenu({ member, onToggleStatus, onRemove }: MemberRowActionsMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const isActive = member.status === "active";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Row actions"
        onClick={() => setOpen((current) => !current)}
        className="flex size-8 items-center justify-center rounded-lg text-black/60 transition-colors hover:bg-mint/15 hover:text-black"
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
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 overflow-hidden rounded-xl border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => {
                onToggleStatus();
                setOpen(false);
              }}
              className="block w-full px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-black/80 transition-colors hover:bg-mint/15 hover:text-black"
            >
              {isActive ? "Suspend" : "Activate"}
            </button>
            <button
              type="button"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="block w-full px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-red-500 transition-colors hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}
