"use client";

import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { paymentFormSchema } from "@/lib/validation";
import type { ZodIssue } from "zod";
import { Card } from "./Card";
import type { Recipient } from "@/types";

const CURRENCIES = [{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }];

function fieldErrorsFromZod(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.join(".")] = i.message;
  return out;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#f8fafc",
      "::placeholder": { color: "#64748b" },
      iconColor: "#14b8a6",
    },
    invalid: { color: "#f87171" },
  },
};

function StripeFormInner({
  recipients,
  prefilled,
  onSuccess,
}: {
  recipients: Recipient[];
  prefilled?: { amount?: number; currency?: string; recipient?: string; description?: string };
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(prefilled?.amount ?? "");
  const [currency, setCurrency] = useState(prefilled?.currency ?? "USD");
  const [recipient, setRecipient] = useState(prefilled?.recipient ?? "");
  const [description, setDescription] = useState(prefilled?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});
      setApiError(null);
      const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
      const parsed = paymentFormSchema.pick({
        amount: true,
        currency: true,
        recipient: true,
        description: true,
      }).safeParse({
        amount: numAmount,
        currency,
        recipient: recipient.trim(),
        description: description.trim(),
      });
      if (!parsed.success) {
        setErrors(fieldErrorsFromZod(parsed.error.issues));
        return;
      }
      if (!stripe || !elements) return;
      const cardEl = elements.getElement(CardElement);
      if (!cardEl) {
        setErrors({ card: "Card details required" });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const data = await res.json();
        if (!res.ok) {
          setApiError(data.message ?? "Failed to create payment");
          setLoading(false);
          return;
        }
        const { error } = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: { card: cardEl },
        });
        if (error) {
          setApiError(error.message ?? "Payment failed");
          setLoading(false);
          return;
        }
        setSuccess(true);
        onSuccess();
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Payment failed");
      }
      setLoading(false);
    },
    [amount, currency, recipient, description, stripe, elements, onSuccess]
  );

  if (success) {
    return (
      <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 text-brand-400 text-sm animate-fade-in">
        Payment completed successfully. It may take a moment to appear in your transactions.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
          {apiError}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-surface-300 mb-1">Amount *</span>
          <input
            type="number"
            step="0.01"
            min="0.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-base"
            required
          />
          {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount}</p>}
        </label>
        <label>
          <span className="block text-sm font-medium text-surface-300 mb-1">Currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-base">
            {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-sm font-medium text-surface-300 mb-1">Recipient *</span>
          {recipients.length > 0 && (
            <select
              className="input-base mb-2"
              value=""
              onChange={(e) => {
                const r = recipients.find((x) => x.id === e.target.value);
                if (r) setRecipient(r.name);
                e.target.value = "";
              }}
            >
              <option value="">Choose saved recipient…</option>
              {recipients.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
          <input
            type="text"
            placeholder="Name or company"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input-base"
            required
          />
          {errors.recipient && <p className="mt-1 text-sm text-red-400">{errors.recipient}</p>}
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-surface-300 mb-1">Description (optional)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-base"
        />
      </label>
      <div>
        <span className="block text-sm font-medium text-surface-300 mb-1">Card details</span>
        <div className="rounded-xl border border-[var(--border)] bg-surface-800/80 p-4 focus-within:border-brand-500/50 transition-colors">
          <CardElement options={cardElementOptions} />
        </div>
        {errors.card && <p className="mt-1 text-sm text-red-400">{errors.card}</p>}
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full sm:w-auto min-w-[180px] rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 font-semibold text-surface-950 shadow-glow-brand hover:from-brand-400 hover:to-brand-500 focus-ring disabled:opacity-50 transition-all"
      >
        {loading ? "Processing…" : "Pay with Stripe"}
      </button>
    </form>
  );
}

export function StripePaymentForm({
  publishableKey,
  recipients,
  prefilled,
  onSuccess,
}: {
  publishableKey: string;
  recipients: Recipient[];
  prefilled?: { amount?: number; currency?: string; recipient?: string; description?: string };
  onSuccess: () => void;
}) {
  const [stripePromise] = useState(() => loadStripe(publishableKey));

  return (
    <Elements stripe={stripePromise}>
      <StripeFormInner recipients={recipients} prefilled={prefilled} onSuccess={onSuccess} />
    </Elements>
  );
}
