/** A compact button for table toolbars and row actions - not the large login-style CTA. */

import type { ButtonHTMLAttributes, ReactElement } from "react";

interface SmallButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
}

const VARIANT_CLASSES: Record<NonNullable<SmallButtonProps["variant"]>, string> = {
  default: "border-white/20 bg-white/10 text-white/85 hover:bg-white/20",
  primary: "border-coral/40 bg-coral/20 text-white hover:bg-coral/30",
  danger: "border-red-400/30 bg-red-400/10 text-red-300 hover:bg-red-400/20",
};

export function SmallButton({
  variant = "default",
  className = "",
  children,
  ...buttonProps
}: SmallButtonProps): ReactElement {
  return (
    <button
      {...buttonProps}
      className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
