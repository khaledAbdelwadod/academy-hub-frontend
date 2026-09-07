/** Shared overlay + glass-card chrome for modals, matching the login card's styling exactly. */

import type { ReactElement, ReactNode } from "react";

interface ModalShellProps {
  title: string;
  onClose: () => void;
  /** Tailwind max-width class for the card, e.g. "max-w-lg". Defaults to a compact size. */
  maxWidthClassName?: string;
  children: ReactNode;
}

export function ModalShell({
  title,
  onClose,
  maxWidthClassName = "max-w-lg",
  children,
}: ModalShellProps): ReactElement {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-10">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default" />

      <div
        className={`relative w-full rounded-[22px] border border-white/15 bg-black/45 p-6 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8 ${maxWidthClassName}`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>

        <h1 className="mb-6 text-2xl font-extrabold text-white">{title}</h1>

        {children}
      </div>
    </div>
  );
}
