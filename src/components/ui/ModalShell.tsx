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
        className={`relative w-full rounded-[22px] border border-mint bg-white p-6 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.35)] sm:p-8 ${maxWidthClassName}`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full text-xl text-black/50 transition-colors hover:bg-mint/15 hover:text-black"
        >
          &times;
        </button>

        <h1 className="mb-6 text-2xl font-extrabold text-black">{title}</h1>

        {children}
      </div>
    </div>
  );
}
