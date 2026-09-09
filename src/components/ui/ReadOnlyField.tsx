/** A read-only labeled value, styled like FormField but visibly non-editable. */

import type { ReactElement } from "react";

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-black/50">{label}</span>
      <span className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-black/50">
        {value}
      </span>
    </div>
  );
}
