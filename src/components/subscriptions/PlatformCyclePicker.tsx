/** Monthly / Yearly buttons (with the prices) for a player choosing how to pay the platform fee. */

import type { ReactElement } from "react";

import type { PlatformCycle, PlatformFeeSummary } from "../../api/subscriptionApi";
import { formatMoney } from "../../utils/subscriptionFormat";

interface PlatformCyclePickerProps {
  fee: PlatformFeeSummary;
  /** The cycle already chosen, highlighted; null when none yet. */
  current: PlatformCycle | null;
  disabled: boolean;
  onChoose: (cycle: PlatformCycle) => void;
}

const CYCLE_TEXT: Record<PlatformCycle, string> = { monthly: "Monthly", yearly: "Yearly" };

export function PlatformCyclePicker({ fee, current, disabled, onChoose }: PlatformCyclePickerProps): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {fee.available_cycles.map((cycle) => {
        const isCurrent = cycle === current;
        return (
          <button
            key={cycle}
            type="button"
            disabled={disabled}
            aria-pressed={isCurrent}
            onClick={() => onChoose(cycle)}
            className={`flex min-w-32 flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isCurrent ? "border-mint bg-mint text-white" : "border-mint bg-white text-black hover:bg-mint/15"
            }`}
          >
            <span className="text-sm font-bold">{CYCLE_TEXT[cycle]}</span>
            <span className={`text-xs ${isCurrent ? "text-white/90" : "text-black/60"}`}>
              {formatMoney(cycle === "monthly" ? fee.monthly : fee.yearly, fee.currency)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
