"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "./Card";
import type { PaymentLink } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function PaymentLinksPage() {
  const [links, setLinks] = useState<(PaymentLink & { url?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-links");
      if (!res.ok) throw new Error("Failed to load links");
      const data = await res.json();
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      setLinks((Array.isArray(data) ? data : []).map((l: PaymentLink) => ({ ...l, url: `${baseUrl}/pay/link/${l.id}` })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const num = parseFloat(amount);
    if (!recipient.trim() || !Number.isFinite(num) || num <= 0) {
      setSubmitError("Enter a valid amount and recipient.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: num,
          currency,
          recipient: recipient.trim(),
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "Failed to create link");
        return;
      }
      setAmount("");
      setRecipient("");
      setDescription("");
      setShowForm(false);
      fetchLinks();
    } catch {
      setSubmitError("Something went wrong.");
    }
    setSubmitting(false);
  }

  function copyUrl(link: PaymentLink & { url?: string }) {
    if (!link.url) return;
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader
          title="Payment links"
          subtitle="Create a link to request payment; share it and the recipient can pay you."
          action={
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 px-4 py-2 text-sm font-medium hover:bg-brand-500/30 transition-colors"
            >
              {showForm ? "Cancel" : "+ Create link"}
            </button>
          }
        />
        {showForm && (
          <form onSubmit={handleCreate} className="p-6 pt-0 space-y-4 border-t border-surface-800 mt-4">
            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
                {submitError}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-1">Amount *</span>
                <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base" required />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-1">Currency</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-base">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-surface-300 mb-1">Recipient (who will pay) *</span>
                <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="input-base" required />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-surface-300 mb-1">Description (optional)</span>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" />
              </label>
            </div>
            <button type="submit" disabled={submitting} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 disabled:opacity-50 transition-colors">
              {submitting ? "Creating…" : "Create link"}
            </button>
          </form>
        )}
        <div className="p-6 pt-0">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-surface-800/50" />)}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">{error}</div>
          ) : links.length === 0 ? (
            <p className="text-surface-400 text-sm py-6 text-center">No payment links yet. Create one to share.</p>
          ) : (
            <ul className="space-y-2" role="list">
              {links.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-800 bg-surface-800/40 px-4 py-3.5">
                  <div>
                    <p className="font-medium text-white">{l.recipient} — {formatAmount(l.amount, l.currency)}</p>
                    <p className="text-sm text-surface-500">{formatDate(l.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyUrl(l)}
                    className="rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-300 hover:text-white transition-colors"
                  >
                    {copiedId === l.id ? "Copied!" : "Copy link"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
