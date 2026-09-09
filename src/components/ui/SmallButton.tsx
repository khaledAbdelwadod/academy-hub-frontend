/** A compact button for table toolbars and row actions - not the large login-style CTA. */

import type { ButtonHTMLAttributes, ReactElement } from "react";

interface SmallButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
}

const VARIANT_CLASSES: Record<NonNullable<SmallButtonProps["variant"]>, string> = {
  default: "border-mint bg-white text-black/80 hover:bg-mint/15",
  primary: "border-mint bg-mint text-black hover:bg-mint/85",
  danger: "border-red-300 bg-red-50 text-red-600 hover:bg-red-100",
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
