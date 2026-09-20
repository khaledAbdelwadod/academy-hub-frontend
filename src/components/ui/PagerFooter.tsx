/** The bottom strip of a paginated table: the total, and Previous / Next. */

import type { ReactElement } from "react";

import { SmallButton } from "./SmallButton";

interface PagerFooterProps {
  /** Total rows across all pages; null while the first page loads. */
  total: number | null;
  previous: string | null;
  next: string | null;
  onGoTo: (url: string) => void;
}

export function PagerFooter({ total, previous, next, onGoTo }: PagerFooterProps): ReactElement {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-mint px-4 py-3 text-sm text-gray-500">
      <span>{total ?? "…"} total</span>
      <div className="flex gap-2">
        <SmallButton disabled={!previous} onClick={() => previous && onGoTo(previous)}>
          Previous
        </SmallButton>
        <SmallButton disabled={!next} onClick={() => next && onGoTo(next)}>
          Next
        </SmallButton>
      </div>
    </div>
  );
}
