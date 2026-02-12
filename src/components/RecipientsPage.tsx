"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "./Card";
import type { Recipient } from "@/types";

export function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recipients");
      if (!res.ok) throw new Error("Failed to load recipients");
      const data = await res.json();
      setRecipients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "Failed to add recipient");
        return;
      }
      setName("");
      setEmail("");
      setAccountNumber("");
      setShowForm(false);
      fetchRecipients();
    } catch {
      setSubmitError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this recipient?")) return;
    try {
      const res = await fetch(`/api/recipients/${id}`, { method: "DELETE" });
      if (res.ok) fetchRecipients();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader
          title="Saved recipients"
          subtitle="Quickly send payments to people you pay often"
          action={
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 px-4 py-2 text-sm font-medium hover:bg-brand-500/30 transition-colors"
            >
              {showForm ? "Cancel" : "+ Add recipient"}
            </button>
          }
        />
        {showForm && (
          <form onSubmit={handleAdd} className="p-6 pt-0 space-y-4 border-t border-surface-800 mt-4">
            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
                {submitError}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-surface-300 mb-1">Name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  required
                  minLength={2}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-1">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-1">Account number</span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="input-base"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Adding…" : "Add recipient"}
            </button>
          </form>
        )}
        <div className="p-6 pt-0">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-800/50" aria-hidden />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
              {error}
            </div>
          ) : recipients.length === 0 ? (
            <p className="text-surface-400 text-sm py-6 text-center">
              No saved recipients. Add one to speed up future payments.
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {recipients.map((rec) => (
                <li
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-800 bg-surface-800/40 px-4 py-3.5"
                >
                  <div>
                    <p className="font-medium text-white">{rec.name}</p>
                    {(rec.email || rec.accountNumber) && (
                      <p className="text-sm text-surface-400">
                        {[rec.email, rec.accountNumber].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(rec.id)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
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
