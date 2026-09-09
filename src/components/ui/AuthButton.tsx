/** The primary call-to-action button. Light theme (mint fill) by default; the
 * still-dark login/register/forgot pages opt into the original gradient styling. */

import type { ButtonHTMLAttributes, ReactElement } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Full-width by default; set false for a compact, half-width button. */
  fullWidth?: boolean;
  theme?: "light" | "dark";
}

const THEME_CLASSES: Record<"light" | "dark", string> = {
  light:
    "bg-mint text-black shadow-[0_10px_20px_-10px_rgba(107,194,150,0.6)] hover:-translate-y-0.5 hover:bg-mint/85 hover:shadow-[0_14px_24px_-10px_rgba(107,194,150,0.7)] focus-visible:ring-pine/40 disabled:hover:shadow-[0_10px_20px_-10px_rgba(107,194,150,0.6)]",
  dark: "bg-gradient-to-b from-sand to-coral text-white shadow-[0_14px_26px_-10px_rgba(231,111,81,0.55)] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-10px_rgba(231,111,81,0.65)] focus-visible:ring-coral/50 disabled:hover:shadow-[0_14px_26px_-10px_rgba(231,111,81,0.55)]",
};

export function AuthButton({
  className = "",
  children,
  fullWidth = true,
  theme = "light",
  ...buttonProps
}: AuthButtonProps): ReactElement {
  const widthClass = fullWidth ? "w-full" : "w-1/2 self-center";

  return (
    <button
      {...buttonProps}
      className={`mt-1.5 rounded-xl px-4 py-3.5 text-sm font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${THEME_CLASSES[theme]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}
