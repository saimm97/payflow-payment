"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "./Card";
import type { MoneyRequest, MoneyRequestStatus } from "@/types";

const CURRENCIES = ["USD", "EUR", "GBP"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function RequestsPage() {
  const [requests, setRequests] = useState<MoneyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fromName, setFromName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const num = parseFloat(amount);
    if (!fromName.trim() || !Number.isFinite(num) || num <= 0) {
      setSubmitError("Enter a valid name and amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: fromName.trim(),
          amount: num,
          currency,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.message || "Failed to create request");
        return;
      }
      setFromName("");
      setAmount("");
      setDescription("");
      setShowForm(false);
      fetchRequests();
    } catch {
      setSubmitError("Something went wrong.");
    }
    setSubmitting(false);
  }

  async function updateStatus(id: string, status: MoneyRequestStatus) {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchRequests();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader
          title="Request payment"
          subtitle="Create a payment request and track when it's paid"
          action={
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 px-4 py-2 text-sm font-medium hover:bg-brand-500/30 transition-colors"
            >
              {showForm ? "Cancel" : "+ New request"}
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
                <span className="block text-sm font-medium text-surface-300 mb-1">Request from (name) *</span>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="input-base"
                  required
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-1">Amount *</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-base"
                  required
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-1">Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-base"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-sm font-medium text-surface-300 mb-1">Description (optional)</span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-base"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating…" : "Create request"}
            </button>
          </form>
        )}
        <div className="p-6 pt-0">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-800/50" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-surface-400 text-sm py-6 text-center">
              No payment requests yet. Create one to request money from someone.
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-800 bg-surface-800/40 px-4 py-3.5"
                >
                  <div>
                    <p className="font-medium text-white">From {req.fromName}</p>
                    <p className="text-sm text-surface-400">
                      {formatAmount(req.amount, req.currency)}
                      {req.description && ` · ${req.description}`} · {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border capitalize ${
                        req.status === "pending"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : req.status === "paid"
                          ? "bg-brand-500/15 text-brand-400 border-brand-500/30"
                          : "bg-surface-700 text-surface-400 border-surface-600"
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(req.id, "paid")}
                          className="text-xs text-brand-400 hover:text-brand-300"
                        >
                          Mark paid
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(req.id, "cancelled")}
                          className="text-xs text-surface-400 hover:text-red-400"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
