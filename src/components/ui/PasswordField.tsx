/** A password input with a show/hide toggle. Light theme by default; the still-dark
 * login/register/forgot pages opt into the original dark-glass styling. */

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactElement } from "react";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  label: string;
  theme?: "light" | "dark";
}

const THEME_CLASSES: Record<"light" | "dark", { label: string; input: string; toggle: string }> = {
  light: {
    label: "text-black/80",
    input:
      "border-mint bg-white text-black placeholder:text-gray-400 focus:border-pine focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/30",
    toggle: "text-black/50 hover:text-black",
  },
  dark: {
    label: "text-white/90",
    input:
      "border-white/30 bg-white/20 text-white placeholder:text-white/60 focus:border-coral focus:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40",
    toggle: "text-white/70 hover:text-white",
  },
};

export function PasswordField({ label, theme = "light", ...inputProps }: PasswordFieldProps): ReactElement {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const classes = THEME_CLASSES[theme];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-xs font-bold uppercase tracking-wider ${classes.label}`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          {...inputProps}
          className={`w-full rounded-xl border py-3 pl-3.5 pr-16 text-sm transition-colors ${classes.input}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className={`absolute inset-y-1.5 right-1.5 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wide ${classes.toggle}`}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
