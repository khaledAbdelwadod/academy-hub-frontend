/** The primary call-to-action button used across the auth forms. */

import type { ButtonHTMLAttributes, ReactElement } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Full-width by default; set false for a compact, half-width button. */
  fullWidth?: boolean;
}

export function AuthButton({
  className = "",
  children,
  fullWidth = true,
  ...buttonProps
}: AuthButtonProps): ReactElement {
  const widthClass = fullWidth ? "w-full" : "w-1/2 self-center";

  return (
    <button
      {...buttonProps}
      className={`mt-1.5 rounded-xl bg-gradient-to-b from-sand to-coral px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_26px_-10px_rgba(231,111,81,0.55)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-10px_rgba(231,111,81,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/50 active:translate-y-0 ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}
