/** A password input with a show/hide toggle, styled for the frosted-glass auth forms. */

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
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-ink/45">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          {...inputProps}
          className="w-full rounded-xl border border-ink/15 bg-white/55 py-3 pl-3.5 pr-16 text-sm text-ink placeholder:text-ink/40 transition-colors focus:border-coral focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-1.5 right-1.5 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wide text-ink/45 hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
