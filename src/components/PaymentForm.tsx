"use client";

import { useState, useCallback, useEffect } from "react";
import { paymentFormSchema, type PaymentFormValues } from "@/lib/validation";
import type { ZodIssue } from "zod";
import { usePayment } from "@/hooks/use-payment";
import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "./Card";
import { StripePaymentForm } from "./StripePaymentForm";
import type { Recipient } from "@/types";
import { TRANSACTION_CATEGORIES } from "@/types";

interface PaymentConfig {
  stripeEnabled: boolean;
  publishableKey: string | null;
}

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

const initialFormState: Record<keyof PaymentFormValues, string | number> = {
  amount: "",
  currency: "USD",
  recipient: "",
  description: "",
  category: "",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  cardholderName: "",
};

function fieldErrorsFromZod(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const path = i.path.join(".");
    if (!out[path]) out[path] = i.message;
  }
  return out;
}

function getTomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function PaymentForm({
  prefilled,
}: {
  prefilled?: {
    amount?: number;
    currency?: string;
    recipient?: string;
    description?: string;
    schedule?: boolean;
  };
} = {}) {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [form, setForm] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [scheduleForLater, setScheduleForLater] = useState(Boolean(prefilled?.schedule));
  const [scheduledDate, setScheduledDate] = useState(() => getTomorrowIso());
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{
    amount: number;
    currency: string;
    recipient: string;
    description?: string;
    category?: string;
  } | null>(null);
  const { submitPayment, loading, error: apiError, result, reset } = usePayment();
  const { refetch } = useTransactions();

  useEffect(() => {
    fetch("/api/payments/config")
      .then((res) => (res.ok ? res.json() : { stripeEnabled: false, publishableKey: null }))
      .then((data) => setPaymentConfig({ stripeEnabled: Boolean(data.stripeEnabled), publishableKey: data.publishableKey ?? null }))
      .catch(() => setPaymentConfig({ stripeEnabled: false, publishableKey: null }));
  }, []);

  useEffect(() => {
    fetch("/api/recipients")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRecipients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!prefilled) return;
    setForm((prev) => ({
      ...prev,
      ...(prefilled.recipient != null && { recipient: prefilled.recipient }),
      ...(prefilled.amount != null && { amount: prefilled.amount }),
      ...(prefilled.currency != null && { currency: prefilled.currency }),
      ...(prefilled.description != null && { description: prefilled.description }),
    }));
    if (prefilled.schedule) setScheduleForLater(true);
  }, [prefilled]);

  const update = useCallback(
    (name: string, value: string | number) => {
      setForm((prev) => ({ ...prev, [name]: value }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      reset();
    },
    [reset]
  );

  const handleCardNumber = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    update("cardNumber", formatCardNumber(raw));
  }, [update]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFieldErrors({});
      setScheduleSuccess(false);

      const amount = typeof form.amount === "string" ? parseFloat(form.amount) : form.amount;
      const currency = String(form.currency);
      const recipient = String(form.recipient).trim();
      const description = String(form.description).trim();
      const category = String(form.category || "").trim() || undefined;

      if (scheduleForLater) {
        if (!recipient || recipient.length < 2) {
          setFieldErrors({ recipient: "Recipient name is required" });
          return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          setFieldErrors({ amount: "Enter a valid amount" });
          return;
        }
        const date = new Date(scheduledDate);
        date.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(date.getTime()) || date.getTime() <= today.getTime()) {
          setFieldErrors({ scheduledDate: "Pick a future date" });
          return;
        }
        setScheduling(true);
        try {
          const res = await fetch("/api/scheduled", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount,
              currency,
              recipient,
              description: description || undefined,
              category,
              scheduledFor: scheduledDate,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setFieldErrors({ form: data.message || "Failed to schedule" });
            return;
          }
          setForm((prev) => ({ ...prev, amount: "", description: "", category: "" }));
          setScheduledDate(getTomorrowIso());
          setScheduleSuccess(true);
        } catch {
          setFieldErrors({ form: "Failed to schedule payment" });
        }
        setScheduling(false);
        return;
      }

      const payload = {
        amount,
        currency,
        recipient,
        description,
        category,
        cardNumber: String(form.cardNumber).replace(/\s/g, ""),
        expiryMonth: String(form.expiryMonth),
        expiryYear: String(form.expiryYear),
        cvv: String(form.cvv),
        cardholderName: String(form.cardholderName).trim(),
      };

      const parsed = paymentFormSchema.safeParse(payload);
      if (!parsed.success) {
        setFieldErrors(fieldErrorsFromZod(parsed.error.issues));
        return;
      }

      setPendingConfirm({
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        recipient: parsed.data.recipient,
        description: parsed.data.description,
        ...(parsed.data.category && { category: parsed.data.category }),
      });
    },
    [form, scheduleForLater, scheduledDate]
  );

  const handleConfirmPayment = useCallback(async () => {
    if (!pendingConfirm) return;
    const { amount, currency, recipient, description, category } = pendingConfirm;
    const res = await submitPayment({
      amount,
      currency,
      recipient,
      description,
      ...(category && { category }),
    });
    setPendingConfirm(null);
    if (res?.success) {
      setForm(initialFormState);
      refetch();
    }
  }, [pendingConfirm, submitPayment, refetch]);

  const isSubmitting = loading || scheduling;

  if (paymentConfig?.stripeEnabled && paymentConfig.publishableKey) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-surface-400 text-sm mb-6">Pay securely with your card via Stripe.</p>
        <StripePaymentForm
          publishableKey={paymentConfig.publishableKey}
          recipients={recipients}
          prefilled={prefilled}
          onSuccess={refetch}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 animate-slide-up"
        id="payment-form"
        aria-label="Payment form"
      >
        {apiError && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm"
        >
          {apiError}
        </div>
      )}

      {result && !result.success && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400 text-sm"
        >
          Payment failed. Please try again.
        </div>
      )}

      {result?.success && (
        <div
          role="status"
          className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-brand-400 text-sm animate-fade-in"
        >
          Payment of {result.transaction.currency} {result.transaction.amount.toFixed(2)} to{" "}
          {result.transaction.recipient} was successful.
        </div>
      )}

      {scheduleSuccess && (
        <div
          role="status"
          className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-brand-400 text-sm animate-fade-in"
        >
          Payment scheduled for {new Date(scheduledDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}. View it in Scheduled.
        </div>
      )}

      {fieldErrors.form && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
          {fieldErrors.form}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-surface-300 mb-1">Amount</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount === "" ? "" : form.amount}
            onChange={(e) =>
              update("amount", e.target.value === "" ? "" : parseFloat(e.target.value) || "")
            }
            className="input-base"
            aria-invalid={!!fieldErrors.amount}
            aria-describedby={fieldErrors.amount ? "err-amount" : undefined}
          />
          {fieldErrors.amount && (
            <p id="err-amount" className="mt-1 text-sm text-red-400" role="alert">
              {fieldErrors.amount}
            </p>
          )}
        </label>
        <label>
          <span className="block text-sm font-medium text-surface-300 mb-1">Currency</span>
          <select
            value={String(form.currency)}
            onChange={(e) => update("currency", e.target.value)}
            className="input-base"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="block text-sm font-medium text-surface-300 mb-1">Recipient</span>
          {recipients.length > 0 && (
            <select
              className="input-base mb-2"
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const rec = recipients.find((r) => r.id === id);
                if (rec) update("recipient", rec.name);
                e.target.value = "";
              }}
            >
              <option value="">Choose a saved recipient…</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Name or company"
            value={String(form.recipient)}
            onChange={(e) => update("recipient", e.target.value)}
            className="input-base"
            aria-invalid={!!fieldErrors.recipient}
            aria-describedby={fieldErrors.recipient ? "err-recipient" : undefined}
          />
          {fieldErrors.recipient && (
            <p id="err-recipient" className="mt-1 text-sm text-red-400" role="alert">
              {fieldErrors.recipient}
            </p>
          )}
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Description (optional)</span>
          <input
            type="text"
            placeholder="What's this for?"
            value={String(form.description)}
            onChange={(e) => update("description", e.target.value)}
            className="input-base"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Category (optional)</span>
          <select
            value={String(form.category)}
            onChange={(e) => update("category", e.target.value)}
            className="input-base"
          >
            <option value="">None</option>
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={scheduleForLater}
            onChange={(e) => {
              setScheduleForLater(e.target.checked);
              setFieldErrors((prev) => ({ ...prev, scheduledDate: undefined, form: undefined }));
              setScheduleSuccess(false);
            }}
            className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-surface-300">Schedule for later</span>
        </label>
        {scheduleForLater && (
          <label className="block">
            <span className="block text-sm font-medium text-surface-300 mb-1">Date to send</span>
            <input
              type="date"
              value={scheduledDate}
              min={getTomorrowIso()}
              onChange={(e) => {
                setScheduledDate(e.target.value);
                setFieldErrors((prev) => ({ ...prev, scheduledDate: undefined }));
              }}
              className="input-base max-w-[180px]"
              aria-invalid={!!fieldErrors.scheduledDate}
            />
            {fieldErrors.scheduledDate && (
              <p className="mt-1 text-sm text-red-400" role="alert">{fieldErrors.scheduledDate}</p>
            )}
          </label>
        )}
      </div>

      {!scheduleForLater && (
      <div className="pt-6 border-t border-surface-800">
        <p className="text-sm text-surface-400 mb-4">Card details (demo — not sent to server)</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2">
            <span className="block text-sm font-medium text-surface-300 mb-1">Card number</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={String(form.cardNumber)}
              onChange={handleCardNumber}
              className="input-base font-mono"
              aria-invalid={!!fieldErrors.cardNumber}
            />
            {fieldErrors.cardNumber && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {fieldErrors.cardNumber}
              </p>
            )}
          </label>
          <label>
            <span className="block text-sm font-medium text-surface-300 mb-1">Expiry</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="MM"
                maxLength={2}
                value={String(form.expiryMonth)}
                onChange={(e) => update("expiryMonth", e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="input-base w-20 font-mono"
                aria-label="Expiry month"
              />
              <span className="text-surface-500 self-center">/</span>
              <input
                type="text"
                placeholder="YY"
                maxLength={2}
                value={String(form.expiryYear)}
                onChange={(e) => update("expiryYear", e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="input-base w-20 font-mono"
                aria-label="Expiry year"
              />
            </div>
            {(fieldErrors.expiryMonth || fieldErrors.expiryYear) && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {fieldErrors.expiryMonth || fieldErrors.expiryYear}
              </p>
            )}
          </label>
          <label>
            <span className="block text-sm font-medium text-surface-300 mb-1">CVV</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              maxLength={4}
              value={String(form.cvv)}
              onChange={(e) => update("cvv", e.target.value.replace(/\D/g, ""))}
              className="input-base font-mono w-24"
              aria-invalid={!!fieldErrors.cvv}
            />
            {fieldErrors.cvv && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {fieldErrors.cvv}
              </p>
            )}
          </label>
        </div>
        <label className="block mt-4">
          <span className="block text-sm font-medium text-surface-300 mb-1">Cardholder name</span>
          <input
            type="text"
            autoComplete="cc-name"
            placeholder="Name on card"
            value={String(form.cardholderName)}
            onChange={(e) => update("cardholderName", e.target.value)}
            className="input-base"
            aria-invalid={!!fieldErrors.cardholderName}
          />
          {fieldErrors.cardholderName && (
            <p className="mt-1 text-sm text-red-400" role="alert">
              {fieldErrors.cardholderName}
            </p>
          )}
        </label>
      </div>
      )}

      <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[180px] rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-surface-950 shadow-glow-brand hover:from-brand-400 hover:to-brand-500 focus-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (scheduleForLater ? "Scheduling…" : "Processing…") : scheduleForLater ? "Schedule payment" : "Send payment"}
          </button>
        </div>
      </form>

      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-payment-title"
        >
          <div className="bg-surface-900 border border-surface-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slide-up">
            <h2 id="confirm-payment-title" className="text-lg font-semibold text-white mb-2">
              Confirm payment
            </h2>
            <p className="text-surface-300 text-sm mb-4">
              Send{" "}
              <strong className="text-white">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: pendingConfirm.currency,
                }).format(pendingConfirm.amount)}
              </strong>{" "}
              to <strong className="text-white">{pendingConfirm.recipient}</strong>?
              {pendingConfirm.description && (
                <span className="block mt-1 text-surface-400">"{pendingConfirm.description}"</span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="flex-1 rounded-xl border border-surface-700 bg-surface-800 py-2.5 text-sm font-medium text-white hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={loading}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
