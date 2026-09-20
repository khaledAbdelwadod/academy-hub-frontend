/** A modal to record a payment against one subscription and review (or remove) the ones already recorded. */

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { Payment } from "../../api/paymentApi";
import { createPaymentsClient } from "../../api/paymentApi";
import type { Subscription } from "../../api/subscriptionApi";
import { toDateKey } from "../../utils/calendarDates";
import { logger } from "../../utils/logger";
import {
  coveredUntil,
  describeBilling,
  describeStatus,
  formatDay,
  formatMoney,
  subscriptionTitle,
} from "../../utils/subscriptionFormat";
import { AuthButton } from "../ui/AuthButton";
import { FormField } from "../ui/FormField";
import { ModalShell } from "../ui/ModalShell";
import { SmallButton } from "../ui/SmallButton";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

interface PaymentsModalProps {
  subscription: Subscription;
  /** The subscription's payments endpoint, e.g. "/api/academies/x/subscriptions/12/payments/". */
  paymentsPath: string;
  onClose: () => void;
  /** Called after a payment is recorded or removed, so the table behind can refresh. */
  onChanged: () => void;
}

type FormState = { status: "idle" } | { status: "saving" } | { status: "error"; message: string };

/** Why a payment can't be recorded right now, or null when it can. */
function blockedReason(subscription: Subscription, paymentCount: number): string | null {
  if (subscription.status === "ended") return "This subscription has ended.";
  if (subscription.billing_type === "") return "The player hasn't chosen monthly or yearly yet.";
  if (subscription.billing_type === "one_time" && paymentCount > 0) return "This one-time plan is already paid.";
  return null;
}

function PaymentRow({ payment, currency, onRemove }: { payment: Payment; currency: string; onRemove: () => void }): ReactElement {
  const period = payment.period_end
    ? `${formatDay(payment.period_start)} – ${formatDay(payment.period_end)}`
    : "One-time payment";
  const details = [formatMoney(payment.amount, currency), `paid ${formatDay(payment.paid_on)}`, payment.recorded_by_name && `by ${payment.recorded_by_name}`, payment.note]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-start justify-between gap-3 border-t border-mint/40 py-3 first:border-t-0">
      <div className="min-w-0">
        <p className="text-sm font-bold text-black">{period}</p>
        <p className="text-xs text-black/60 [overflow-wrap:anywhere]">{details}</p>
      </div>
      <SmallButton variant="danger" onClick={onRemove}>
        Remove
      </SmallButton>
    </li>
  );
}

export function PaymentsModal({ subscription, paymentsPath, onClose, onChanged }: PaymentsModalProps): ReactElement {
  const client = useMemo(() => createPaymentsClient(paymentsPath), [paymentsPath]);
  const today = toDateKey(new Date());
  const [current, setCurrent] = useState(subscription);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [amount, setAmount] = useState(subscription.price ?? "");
  const [paidOn, setPaidOn] = useState(today);
  const [periodStart, setPeriodStart] = useState(subscription.next_period_start ?? today);
  const [note, setNote] = useState("");
  const [formState, setFormState] = useState<FormState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    client
      .list()
      .then((list) => {
        if (!cancelled) setPayments(list);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load the payments.";
        logger.error("Failed to load payments", { error: message });
        setFormState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const isRecurring = current.billing_type === "recurring";
  const reason = payments === null ? null : blockedReason(current, payments.length);
  const coverage =
    isRecurring && periodStart && current.interval_unit
      ? `${formatDay(periodStart)} – ${formatDay(coveredUntil(periodStart, current.interval_count ?? 1, current.interval_unit))}`
      : null;

  /** Take the subscription's new status and re-seed the form with sensible defaults for the next payment. */
  function applyUpdate(updated: Subscription): void {
    setCurrent(updated);
    setAmount(updated.price ?? "");
    setPeriodStart(updated.next_period_start ?? today);
    setNote("");
    onChanged();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormState({ status: "saving" });
    client
      .record({ amount, paid_on: paidOn, ...(isRecurring ? { period_start: periodStart } : {}), note: note.trim() })
      .then((result) => {
        setPayments((list) => [result.payment, ...(list ?? [])]);
        applyUpdate(result.subscription);
        setFormState({ status: "idle" });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not record that payment.";
        logger.error("Failed to record payment", { error: message });
        setFormState({ status: "error", message });
      });
  }

  function handleRemove(payment: Payment): void {
    if (!window.confirm("Remove this payment? The subscription's status will be recalculated.")) return;
    setFormState({ status: "idle" });
    client
      .remove(payment.id)
      .then((updated) => {
        setPayments((list) => (list ?? []).filter((item) => item.id !== payment.id));
        applyUpdate(updated);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not remove that payment.";
        logger.error("Failed to remove payment", { error: message });
        setFormState({ status: "error", message });
      });
  }

  const memberName = `${current.member.first_name} ${current.member.last_name}`;

  return (
    <ModalShell title="Payments" onClose={onClose} maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-extrabold text-black">{memberName}</p>
            <p className="text-sm text-black/70">
              {subscriptionTitle(current)} · {describeBilling(current)}
              {current.price !== null && ` · ${formatMoney(current.price, current.currency)}`}
            </p>
            <p className="mt-0.5 text-sm text-black">{describeStatus(current)}</p>
          </div>
          <SubscriptionStatusBadge status={current.status} />
        </div>

        {reason ? (
          <p className="rounded-xl border border-mint bg-white px-4 py-3 text-sm text-black/70">{reason}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-mint p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-black/80">Record a payment</p>
            <div className={`grid grid-cols-1 gap-3 ${isRecurring ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <FormField
                id="pay-amount"
                label="Amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setAmount(event.target.value)}
                required
              />
              <FormField
                id="pay-paid-on"
                label="Paid on"
                type="date"
                value={paidOn}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPaidOn(event.target.value)}
                required
              />
              {isRecurring && (
                <FormField
                  id="pay-period-start"
                  label="Covers from"
                  type="date"
                  value={periodStart}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setPeriodStart(event.target.value)}
                  required
                />
              )}
            </div>
            <FormField
              id="pay-note"
              label="Note"
              optional
              placeholder="e.g. receipt number"
              value={note}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setNote(event.target.value)}
            />
            {coverage && <p className="text-xs text-black/60">This payment covers {coverage}.</p>}
            <AuthButton type="submit" fullWidth={false} disabled={formState.status === "saving" || amount === ""}>
              {formState.status === "saving" ? "Saving…" : "Record payment"}
            </AuthButton>
          </form>
        )}

        {formState.status === "error" && <p className="text-sm text-red-400">{formState.message}</p>}

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-black/80">History</p>
          {payments === null && <p className="text-sm text-black/50">Loading…</p>}
          {payments?.length === 0 && <p className="text-sm text-black/50">No payments recorded yet.</p>}
          {payments && payments.length > 0 && (
            <ul className="max-h-64 overflow-y-auto">
              {payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  currency={current.currency}
                  onRemove={() => handleRemove(payment)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
