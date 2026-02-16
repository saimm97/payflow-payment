"use client";

import { useState, useCallback, useEffect } from "react";
import type { Transaction } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRefund?: (transactionId: string) => void;
  refetch?: () => void;
}

export function TransactionDetailModal({ transaction: initialTransaction, onClose, onRefund, refetch }: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState(initialTransaction);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [note, setNote] = useState(initialTransaction?.note ?? "");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setTransaction(initialTransaction);
    setNote(initialTransaction?.note ?? "");
  }, [initialTransaction]);

  const saveNote = useCallback(async () => {
    if (!transaction) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTransaction(updated);
        refetch?.();
      }
    } finally {
      setSavingNote(false);
    }
  }, [transaction, note, refetch]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !transaction) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Receipt - ${transaction.id}</title>
      <style>body{font-family:system-ui;max-width:400px;margin:2rem auto;padding:1rem;color:#111;}
      h1{font-size:1.25rem;} .amount{font-size:1.5rem;font-weight:700;margin:1rem 0;}
      dl{display:grid;gap:0.5rem;} dt{font-size:0.75rem;color:#666;text-transform:uppercase;}
      dd{margin:0;}</style></head><body>
      <h1>Payment receipt</h1>
      <div class="amount">${formatAmount(transaction.amount, transaction.currency)}</div>
      <dl>
        <dt>Recipient</dt><dd>${transaction.recipient}</dd>
        <dt>Description</dt><dd>${transaction.description || "—"}</dd>
        ${transaction.category ? `<dt>Category</dt><dd>${transaction.category}</dd>` : ""}
        <dt>Transaction ID</dt><dd>${transaction.id}</dd>
        <dt>Date</dt><dd>${formatDate(transaction.createdAt)}</dd>
        <dt>Status</dt><dd>${transaction.status}</dd>
      </dl>
      <p style="margin-top:2rem;font-size:0.75rem;color:#666;">PayFlow — Payment receipt. This is not a tax document.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }, [transaction]);

  const handleRefund = useCallback(async () => {
    if (!transaction || !onRefund) return;
    if (!confirm(`Refund ${formatAmount(transaction.amount, transaction.currency)} to ${transaction.recipient}?`)) return;
    setRefundError(null);
    setRefunding(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transaction.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefundError(data.message || "Refund failed");
        return;
      }
      onRefund(transaction.id);
      refetch?.();
      onClose();
    } catch {
      setRefundError("Refund failed");
    } finally {
      setRefunding(false);
    }
  }, [transaction, onRefund, refetch, onClose]);

  if (!transaction) return null;

  const statusColors: Record<string, string> = {
    completed: "text-brand-400",
    pending: "text-amber-400",
    failed: "text-red-400",
    refunded: "text-surface-400",
  };
  const colorClass = statusColors[transaction.status] ?? "text-surface-400";
  const canRefund = transaction.status === "completed" && !transaction.refundedAt && transaction.stripePaymentIntentId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-detail-title"
    >
      <div className="bg-surface-900 border border-surface-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6 border-b border-surface-800 flex items-center justify-between">
          <h2 id="transaction-detail-title" className="text-lg font-semibold text-white">
            Transaction details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center py-4">
            <p className={`text-2xl font-bold ${colorClass}`}>
              {formatAmount(transaction.amount, transaction.currency)}
            </p>
            <p className="text-sm text-surface-400 mt-1 capitalize">{transaction.status}</p>
            {transaction.refundedAt && (
              <p className="text-xs text-surface-500 mt-1">Refunded {formatDate(transaction.refundedAt)}</p>
            )}
          </div>
          {refundError && (
            <p className="text-sm text-red-400" role="alert">{refundError}</p>
          )}
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Recipient</dt>
              <dd className="mt-1 text-white font-medium">{transaction.recipient}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Description</dt>
              <dd className="mt-1 text-surface-300">{transaction.description || "—"}</dd>
            </div>
            {transaction.category && (
              <div>
                <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Category</dt>
                <dd className="mt-1 text-surface-300">{transaction.category}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Transaction ID</dt>
              <dd className="mt-1 font-mono text-sm text-surface-400">{transaction.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Date</dt>
              <dd className="mt-1 text-surface-300">{formatDate(transaction.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Note</dt>
              <dd className="mt-1">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={saveNote}
                  placeholder="Add a note…"
                  className="input-base text-sm mt-0"
                />
                {savingNote && <span className="text-xs text-surface-500 mt-1">Saving…</span>}
              </dd>
            </div>
          </dl>
        </div>
        <div className="p-6 pt-0 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 rounded-xl border border-surface-700 bg-surface-800 py-2.5 text-sm font-medium text-white hover:bg-surface-700 transition-colors"
            >
              Print receipt
            </button>
            {canRefund && (
              <button
                type="button"
                onClick={handleRefund}
                disabled={refunding}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                {refunding ? "Refunding…" : "Refund"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-surface-700 bg-surface-800 py-2.5 text-sm font-medium text-white hover:bg-surface-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
