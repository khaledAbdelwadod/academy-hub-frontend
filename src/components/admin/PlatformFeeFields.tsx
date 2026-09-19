/** The platform-fee section of the academy form: what each player pays, the free trial, and how to pay. */

import type { ReactElement } from "react";

import type { AdminAcademy, AdminAcademyUpdate } from "../../api/adminAcademiesApi";
import { FormField } from "../ui/FormField";

const DEFAULT_TRIAL_DAYS = 7;
const MAX_TRIAL_DAYS = 365;

interface PlatformFeeFieldsProps {
  /** The academy being edited, or null when creating one. */
  academy: AdminAcademy | null;
  disabled: boolean;
}

type PlatformFeeValues = Pick<
  AdminAcademyUpdate,
  | "platform_fee_monthly"
  | "platform_fee_yearly"
  | "platform_fee_currency"
  | "platform_fee_trial_days"
  | "platform_fee_instructions"
>;

function readPrice(data: FormData, name: string): string | null {
  const value = String(data.get(name) ?? "").trim();
  return value === "" ? null : value;
}

/**
 * Read the platform-fee fields out of the academy form.
 *
 * @param data - The submitted academy form.
 * @returns The values to send; an empty price becomes null (that billing cycle isn't offered).
 */
export function readPlatformFee(data: FormData): PlatformFeeValues {
  const trialDays = String(data.get("platform_fee_trial_days") ?? "").trim();
  return {
    platform_fee_monthly: readPrice(data, "platform_fee_monthly"),
    platform_fee_yearly: readPrice(data, "platform_fee_yearly"),
    platform_fee_currency: String(data.get("platform_fee_currency") ?? "").trim().toUpperCase(),
    platform_fee_trial_days: trialDays === "" ? DEFAULT_TRIAL_DAYS : Number(trialDays),
    platform_fee_instructions: String(data.get("platform_fee_instructions") ?? "").trim(),
  };
}

export function PlatformFeeFields({ academy, disabled }: PlatformFeeFieldsProps): ReactElement {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-mint p-4" disabled={disabled}>
      <legend className="px-1 text-xs font-bold uppercase tracking-wider text-black/80">Platform fee</legend>
      <p className="text-xs text-black/60">
        What each player pays the platform to use this academy. Leave both prices empty for a free academy.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField
          id="ac-fee-monthly"
          name="platform_fee_monthly"
          label="Monthly"
          optional
          type="number"
          min="0"
          step="0.01"
          defaultValue={academy?.platform_fee_monthly ?? ""}
        />
        <FormField
          id="ac-fee-yearly"
          name="platform_fee_yearly"
          label="Yearly"
          optional
          type="number"
          min="0"
          step="0.01"
          defaultValue={academy?.platform_fee_yearly ?? ""}
        />
        <FormField
          id="ac-fee-currency"
          name="platform_fee_currency"
          label="Currency"
          placeholder="EGP"
          maxLength={3}
          style={{ textTransform: "uppercase" }}
          defaultValue={academy?.platform_fee_currency ?? ""}
        />
      </div>

      <FormField
        id="ac-fee-trial"
        name="platform_fee_trial_days"
        label="Free trial (days)"
        type="number"
        min="0"
        max={MAX_TRIAL_DAYS}
        step="1"
        defaultValue={academy?.platform_fee_trial_days ?? DEFAULT_TRIAL_DAYS}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ac-fee-instructions" className="text-xs font-bold uppercase tracking-wider text-black/80">
          How players pay <span className="ml-1 font-medium normal-case tracking-normal text-black/40">(optional)</span>
        </label>
        <textarea
          id="ac-fee-instructions"
          name="platform_fee_instructions"
          rows={3}
          defaultValue={academy?.platform_fee_instructions ?? ""}
          placeholder="e.g. Transfer to account 123-456, then message us your receipt."
          className="w-full rounded-xl border border-mint bg-white px-3.5 py-3 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
        />
      </div>

      <p className="text-xs text-black/60">
        Setting a fee starts the free trial today for players already in this academy. Once their trial is over, a
        player with nothing paid can&apos;t use the academy.
      </p>
    </fieldset>
  );
}
