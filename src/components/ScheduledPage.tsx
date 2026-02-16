"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "./Card";
import type { ScheduledPayment } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function ScheduledPage() {
  const [list, setList] = useState<ScheduledPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scheduled");
      if (!res.ok) throw new Error("Failed to load scheduled payments");
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled payment? You can create a new one later.")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/scheduled/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) fetchList();
    } finally {
      setCancellingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this scheduled payment from the list?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/scheduled/${id}`, { method: "DELETE" });
      if (res.ok) fetchList();
    } finally {
      setCancellingId(null);
    }
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-surface-400">
          Payments you scheduled for a future date. Create one from the Send payment page by choosing &quot;Schedule for later&quot;.
        </p>
        <Link
          href="/pay?schedule=1"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-surface-950 shadow-glow-brand hover:from-brand-400 hover:to-brand-500 transition-all focus-ring"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Schedule payment
        </Link>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-800/50" aria-hidden />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-surface-400 text-sm mb-4">No scheduled payments.</p>
            <Link
              href="/pay?schedule=1"
              className="text-brand-400 hover:text-brand-300 text-sm font-medium"
            >
              Schedule your first payment →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-surface-800">
            {list.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-surface-800/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{item.recipient}</p>
                  <p className="text-sm text-surface-400 truncate">
                    {formatAmount(item.amount, item.currency)}
                    {item.description ? ` · ${item.description}` : ""}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Scheduled for {formatDate(item.scheduledFor)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/pay?recipient=${encodeURIComponent(item.recipient)}&amount=${item.amount}&currency=${item.currency}&description=${encodeURIComponent(item.description || "")}`}
                    className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-400 hover:bg-brand-500/20 transition-colors"
                  >
                    Pay now
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleCancel(item.id)}
                    disabled={cancellingId === item.id}
                    className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm font-medium text-surface-300 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    {cancellingId === item.id ? "Cancelling…" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={cancellingId === item.id}
                    className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm font-medium text-surface-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                    aria-label="Delete scheduled payment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
