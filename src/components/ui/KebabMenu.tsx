/** A compact "⋮" menu of row actions, matching the kebab menus used across the admin tables. */

import { useState } from "react";
import type { ReactElement } from "react";

export interface KebabMenuItem {
  label: string;
  onSelect: () => void;
  /** Red text, for destructive actions like Delete. */
  danger?: boolean;
}

interface KebabMenuProps {
  ariaLabel: string;
  items: KebabMenuItem[];
}

export function KebabMenu({ ariaLabel, items }: KebabMenuProps): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
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
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-44 overflow-hidden rounded-xl border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)]">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={`block w-full px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide transition-colors ${
                  item.danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-black/80 hover:bg-mint/15 hover:text-black"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
