"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "./Card";
import { TransactionDetailModal } from "./TransactionDetailModal";
import type { Transaction, TransactionStatus } from "@/types";

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
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles: Record<TransactionStatus, string> = {
    completed: "bg-brand-500/15 text-brand-400 border-brand-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

const STATUS_OPTIONS: { value: "" | TransactionStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export function TransactionsPage() {
  const { transactions, loading, error } = useTransactions();
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    let list = transactions;
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.recipient.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((t) => new Date(t.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.createdAt).getTime() <= to.getTime());
    }
    return list;
  }, [transactions, statusFilter, searchQuery, dateFrom, dateTo]);

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
    <>
      <Card className="overflow-hidden animate-slide-up">
        <div className="p-6 border-b border-surface-800 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-surface-400">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "" | TransactionStatus)}
                className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-white focus-ring"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-surface-400">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-white focus-ring"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-surface-400">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-white focus-ring"
              />
            </label>
            <div className="flex-1 min-w-[200px]">
              <input
                type="search"
                placeholder="Search recipient or description…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-white placeholder-surface-500 focus-ring"
              />
            </div>
          </div>
          <p className="text-sm text-surface-500">
            {filtered.length} of {transactions.length} transactions
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 animate-pulse space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-800/50" aria-hidden />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-surface-400 text-sm">
              {statusFilter || searchQuery || dateFrom || dateTo
                ? "No transactions match your filters."
                : "No transactions yet."}
            </div>
          ) : (
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Recipient</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="border-b border-surface-800/80 hover:bg-surface-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-white">{tx.recipient}</td>
                    <td className="px-6 py-4 text-surface-400 text-sm max-w-xs truncate">
                      {tx.description || "—"}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-brand-400">
                      {formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4 text-surface-400 text-sm whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </>
  );
}
