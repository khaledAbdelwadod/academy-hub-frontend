/** A labeled text input. Light theme by default (white bg, mint border); the
 * still-dark login/register/forgot pages opt into the original dark-glass styling. */

import type { InputHTMLAttributes, ReactElement } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
  theme?: "light" | "dark";
}

const THEME_CLASSES: Record<"light" | "dark", { label: string; optional: string; input: string }> = {
  light: {
    label: "text-black/80",
    optional: "text-black/40",
    input:
      "border-mint bg-white text-black placeholder:text-gray-400 focus:border-pine focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/30",
  },
  dark: {
    label: "text-white/90",
    optional: "text-white/65",
    input:
      "border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-coral focus:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40",
  },
};

export function FormField({ label, optional, id, theme = "light", ...inputProps }: FormFieldProps): ReactElement {
  const classes = THEME_CLASSES[theme];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-xs font-bold uppercase tracking-wider ${classes.label}`}>
        {label}
        {optional && <span className={`ml-1 font-medium normal-case tracking-normal ${classes.optional}`}>(optional)</span>}
      </label>
      <input
        id={id}
        {...inputProps}
        className={`w-full rounded-xl border px-3.5 py-3 text-sm transition-colors ${classes.input}`}
      />
    </div>
  );
}
