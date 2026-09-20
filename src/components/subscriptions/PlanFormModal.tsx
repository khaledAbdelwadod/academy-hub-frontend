/** A modal for the manager to design a plan (or edit one): name, price, and one-time or repeating billing. */

import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Plan, PlanBillingType, PlanInput, PlanIntervalUnit } from "../../api/academySubscriptionApi";
import { createPlan, updatePlan } from "../../api/academySubscriptionApi";
import { logger } from "../../utils/logger";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { SelectField } from "../ui/SelectField";

interface PlanFormModalProps {
  subdomain: string;
  /** The plan being edited, or null to create one. */
  plan: Plan | null;
  /** Pre-fills the currency of a new plan (the currency the academy's other plans use). */
  defaultCurrency: string;
  onClose: () => void;
  onSaved: () => void;
}

const BILLING_OPTIONS: { value: PlanBillingType; label: string }[] = [
  { value: "one_time", label: "One-time payment" },
  { value: "recurring", label: "Repeats" },
];

const UNIT_OPTIONS: { value: PlanIntervalUnit; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "week", label: "Weeks" },
  { value: "month", label: "Months" },
  { value: "year", label: "Years" },
];

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

export function PlanFormModal({ subdomain, plan, defaultCurrency, onClose, onSaved }: PlanFormModalProps): ReactElement {
  const isCreate = plan === null;
  const [billingType, setBillingType] = useState<PlanBillingType>(plan?.billing_type ?? "recurring");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const isRecurring = billingType === "recurring";

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: PlanInput = {
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      price: String(data.get("price") ?? "").trim(),
      currency: String(data.get("currency") ?? "").trim().toUpperCase(),
      billing_type: billingType,
      interval_count: isRecurring ? Number(data.get("interval_count")) : null,
      interval_unit: isRecurring ? (String(data.get("interval_unit")) as PlanIntervalUnit) : "",
    };

    setSaveState({ status: "saving" });
    const request = plan ? updatePlan(subdomain, plan.id, input) : createPlan(subdomain, input);
    request
      .then(() => onSaved())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not save that plan.";
        logger.error("Failed to save plan", { error: message });
        setSaveState({ status: "error", message });
      });
  }

  return (
    <ModalShell title={isCreate ? "New Plan" : "Edit Plan"} onClose={onClose} maxWidthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id="plan-name"
          name="name"
          label="Plan name"
          placeholder="e.g. Monthly training"
          defaultValue={plan?.name}
          maxLength={200}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-description" className="text-xs font-bold uppercase tracking-wider text-black/80">
            Description <span className="ml-1 font-medium normal-case tracking-normal text-black/40">(optional)</span>
          </label>
          <textarea
            id="plan-description"
            name="description"
            rows={2}
            defaultValue={plan?.description}
            className="w-full rounded-xl border border-mint bg-white px-3.5 py-3 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="plan-price"
            name="price"
            label="Price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={plan?.price}
            required
          />
          <FormField
            id="plan-currency"
            name="currency"
            label="Currency"
            placeholder="EGP"
            maxLength={3}
            style={{ textTransform: "uppercase" }}
            defaultValue={plan?.currency ?? defaultCurrency}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectField
            id="plan-billing"
            label="Billing"
            options={BILLING_OPTIONS}
            placeholder={null}
            value={billingType}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setBillingType(event.target.value as PlanBillingType)}
          />
          {isRecurring && (
            <>
              <FormField
                id="plan-interval-count"
                name="interval_count"
                label="Every"
                type="number"
                min="1"
                step="1"
                defaultValue={plan?.interval_count ?? 1}
                required
              />
              <SelectField
                id="plan-interval-unit"
                name="interval_unit"
                label="Unit"
                options={UNIT_OPTIONS}
                placeholder={null}
                defaultValue={plan?.interval_unit || "month"}
              />
            </>
          )}
        </div>

        {!isCreate && (
          <p className="text-xs text-black/60">
            Changing the price or billing doesn&apos;t change members who are already subscribed - they keep what they
            were assigned with.
          </p>
        )}

        {saveState.status === "error" && <p className="text-sm text-red-400">{saveState.message}</p>}

        <AuthButton type="submit" fullWidth={false} disabled={saveState.status === "saving"}>
          {saveState.status === "saving" ? "Saving…" : isCreate ? "Create plan" : "Save changes"}
        </AuthButton>
      </form>
    </ModalShell>
  );
}
