"use client";

import type { Transaction } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  const styles = {
    completed: "bg-brand-500/20 text-brand-400 border-brand-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
}

export function TransactionList({
  transactions,
  loading,
  error,
  emptyMessage = "No transactions yet. Send your first payment above.",
}: TransactionListProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-surface-800/50"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="text-surface-400 text-sm py-8 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2" role="list">
      {transactions.map((tx) => (
        <li
          key={tx.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-800 bg-surface-800/40 px-4 py-3.5 transition-colors hover:bg-surface-800/60"
        >
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{tx.recipient}</p>
            <p className="text-sm text-surface-400 truncate">
              {tx.description || "—"} · {formatDate(tx.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="font-mono font-semibold text-brand-400">
              {formatAmount(tx.amount, tx.currency)}
            </span>
            <StatusBadge status={tx.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
