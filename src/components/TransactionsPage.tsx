"use client";

import { useState, useMemo, useEffect } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { Card } from "./Card";
import { TransactionDetailModal } from "./TransactionDetailModal";
import type { Transaction, TransactionStatus } from "@/types";
import { TRANSACTION_CATEGORIES } from "@/types";

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
    refunded: "bg-surface-700 text-surface-400 border-surface-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: "" | TransactionStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  ...TRANSACTION_CATEGORIES.map((c) => ({ value: c, label: c })),
];

function exportToCsv(transactions: Transaction[]) {
  const headers = ["ID", "Recipient", "Description", "Category", "Amount", "Currency", "Status", "Date"];
  const rows = transactions.map((t) => [
    t.id,
    t.recipient,
    t.description || "",
    t.category || "",
    t.amount,
    t.currency,
    t.status,
    new Date(t.createdAt).toISOString(),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToPdf(transactions: Transaction[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const dateRange =
    transactions.length > 0
      ? `${new Date(transactions[transactions.length - 1].createdAt).toLocaleDateString("en-US")} – ${new Date(transactions[0].createdAt).toLocaleDateString("en-US")}`
      : "—";
  const rows = transactions
    .map(
      (t) =>
        `<tr>
          <td>${t.recipient}</td>
          <td>${t.description || "—"}</td>
          <td>${t.category || "—"}</td>
          <td>${t.currency} ${t.amount.toFixed(2)}</td>
          <td>${t.status}</td>
          <td>${new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
        </tr>`
    )
    .join("");
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>PayFlow Statement</title>
    <style>body{font-family:system-ui;max-width:900px;margin:2rem auto;padding:1rem;color:#111;}
    h1{font-size:1.5rem;} .meta{color:#666;font-size:0.875rem;margin-bottom:1.5rem;}
    table{width:100%;border-collapse:collapse;} th,td{padding:0.5rem 0.75rem;text-align:left;border-bottom:1px solid #eee;}
    th{font-size:0.75rem;text-transform:uppercase;color:#666;}</style></head><body>
    <h1>PayFlow — Transaction statement</h1>
    <p class="meta">Period: ${dateRange} · ${transactions.length} transaction(s)</p>
    <table>
      <thead><tr><th>Recipient</th><th>Description</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:2rem;font-size:0.75rem;color:#666;">PayFlow. This is not a tax document. Generated ${new Date().toLocaleString("en-US")}.</p>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
}

export function TransactionsPage() {
  const { transactions, loading, error, refetch } = useTransactions();
  const [statusFilter, setStatusFilter] = useState<"" | TransactionStatus>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = transactions;
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (categoryFilter) list = list.filter((t) => (t.category || "") === categoryFilter);
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
  }, [transactions, statusFilter, categoryFilter, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, searchQuery, dateFrom, dateTo]);

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
              <span className="text-sm text-surface-400">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm text-white focus-ring"
              >
                {CATEGORY_OPTIONS.map((o) => (
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-surface-500">
              {filtered.length} of {transactions.length} transactions
              {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportToCsv(filtered)}
                disabled={filtered.length === 0}
                className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-700 disabled:opacity-50 transition-colors"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportToPdf(filtered)}
                disabled={filtered.length === 0}
                className="rounded-xl border border-surface-700 bg-surface-800 px-4 py-2 text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-700 disabled:opacity-50 transition-colors"
              >
                Print / PDF
              </button>
              {totalPages > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-xl border border-surface-700 bg-surface-800 px-3 py-2 text-sm font-medium text-surface-300 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-xl border border-surface-700 bg-surface-800 px-3 py-2 text-sm font-medium text-surface-300 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </>
              )}
            </div>
          </div>
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
              {statusFilter || categoryFilter || searchQuery || dateFrom || dateTo
                ? "No transactions match your filters."
                : "No transactions yet."}
            </div>
          ) : (
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Recipient</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="border-b border-surface-800/80 hover:bg-surface-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-white">{tx.recipient}</td>
                    <td className="px-6 py-4 text-surface-400 text-sm max-w-xs truncate">
                      {tx.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-surface-500 text-sm">
                      {tx.category || "—"}
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
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onRefund={() => setSelectedTx(null)}
        refetch={refetch}
      />
    </>
  );
}
