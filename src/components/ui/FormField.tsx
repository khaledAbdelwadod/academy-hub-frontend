/** A labeled text input, styled for the black frosted-glass auth forms. */

import type { InputHTMLAttributes, ReactElement } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
}

export function FormField({ label, optional, id, ...inputProps }: FormFieldProps): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-white/50">
        {label}
        {optional && <span className="ml-1 font-medium normal-case tracking-normal text-white/40">(optional)</span>}
      </label>
      <input
        id={id}
        {...inputProps}
        className="w-full rounded-xl border border-white/30 bg-white/20 px-3.5 py-3 text-sm text-white placeholder:text-white/50 transition-colors focus:border-coral focus:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/40"
      />
    </div>
  );
}
