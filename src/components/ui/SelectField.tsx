/** A labeled dropdown, styled to match FormField (white bg, mint border). */

import type { ReactElement, SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Text of the empty first option (value ""), e.g. "Select…"; pass null for no empty option. */
  placeholder?: string | null;
  optional?: boolean;
}

export function SelectField({
  label,
  options,
  placeholder = "Select…",
  optional,
  id,
  ...selectProps
}: SelectFieldProps): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-black/80">
        {label}
        {optional && <span className="ml-1 font-medium normal-case tracking-normal text-black/40">(optional)</span>}
      </label>
      <select
        id={id}
        {...selectProps}
        className="w-full rounded-xl border border-mint bg-white px-3.5 py-3 text-sm text-black transition-colors focus:border-pine focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/30"
      >
        {placeholder !== null && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
