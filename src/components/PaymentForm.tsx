"use client";

import { useState, useCallback, useEffect } from "react";
import { paymentFormSchema, type PaymentFormValues } from "@/lib/validation";
import type { ZodIssue } from "zod";
import { usePayment } from "@/hooks/use-payment";
import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "./Card";
import type { Recipient } from "@/types";

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

export function PaymentForm() {
  const [form, setForm] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const { submitPayment, loading, error: apiError, result, reset } = usePayment();
  const { refetch } = useTransactions();

  useEffect(() => {
    fetch("/api/recipients")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRecipients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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

      const payload = {
        amount: typeof form.amount === "string" ? parseFloat(form.amount) : form.amount,
        currency: String(form.currency),
        recipient: String(form.recipient).trim(),
        description: String(form.description).trim(),
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

      const { amount, currency, recipient, description } = parsed.data;
      const res = await submitPayment({ amount, currency, recipient, description });
      if (res?.success) {
        setForm(initialFormState);
        refetch();
      }
    },
    [form, submitPayment, refetch]
  );

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

      <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-w-[180px] rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-surface-950 shadow-glow-brand hover:from-brand-400 hover:to-brand-500 focus-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Processing…" : "Send payment"}
          </button>
        </div>
      </form>
    </Card>
  );
}
