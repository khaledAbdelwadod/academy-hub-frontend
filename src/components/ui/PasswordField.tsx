/** A password input with a show/hide toggle, styled for the black frosted-glass auth forms. */

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactElement } from "react";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  label: string;
}

export function PasswordField({ label, ...inputProps }: PasswordFieldProps): ReactElement {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-white/50">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          {...inputProps}
          className="w-full rounded-xl border border-white/30 bg-white/20 py-3 pl-3.5 pr-16 text-sm text-white placeholder:text-white/50 transition-colors focus:border-coral focus:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-1.5 right-1.5 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wide text-white/50 hover:text-white"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
