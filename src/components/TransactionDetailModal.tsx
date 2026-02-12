"use client";

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
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const statusColors = {
    completed: "text-brand-400",
    pending: "text-amber-400",
    failed: "text-red-400",
  };

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
            <p className={`text-2xl font-bold ${statusColors[transaction.status]}`}>
              {formatAmount(transaction.amount, transaction.currency)}
            </p>
            <p className="text-sm text-surface-400 mt-1 capitalize">{transaction.status}</p>
          </div>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Recipient</dt>
              <dd className="mt-1 text-white font-medium">{transaction.recipient}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Description</dt>
              <dd className="mt-1 text-surface-300">{transaction.description || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Transaction ID</dt>
              <dd className="mt-1 font-mono text-sm text-surface-400">{transaction.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 uppercase tracking-wider">Date</dt>
              <dd className="mt-1 text-surface-300">{formatDate(transaction.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div className="p-6 pt-0">
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
