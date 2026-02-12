import type { Transaction, TransactionStatus } from "@/types";

const transactions: Transaction[] = [
  {
    id: "tx_1",
    amount: 150.0,
    currency: "USD",
    recipient: "Acme Corp",
    description: "Office supplies",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "tx_2",
    amount: 2999.99,
    currency: "USD",
    recipient: "Tech Solutions Ltd",
    description: "Software license",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "tx_3",
    amount: 75.5,
    currency: "USD",
    recipient: "Jane Doe",
    description: "Reimbursement",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

const byStripePaymentIntentId = new Map<string, Transaction>();

function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function listTransactions(): Transaction[] {
  return [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTransactionById(id: string): Transaction | undefined {
  return transactions.find((t) => t.id === id);
}

export function getTransactionByStripePaymentIntentId(piId: string): Transaction | undefined {
  return byStripePaymentIntentId.get(piId);
}

export interface ProcessPaymentParams {
  amount: number;
  currency: string;
  recipient: string;
  description?: string;
}

/** Demo mode: simulate payment without Stripe */
export function processPayment(
  params: ProcessPaymentParams
): { transaction: Transaction; success: boolean } {
  const status: TransactionStatus = Math.random() > 0.1 ? "completed" : "failed";
  const transaction: Transaction = {
    id: generateId(),
    amount: params.amount,
    currency: params.currency,
    recipient: params.recipient,
    description: params.description ?? "",
    status,
    createdAt: new Date().toISOString(),
  };
  transactions.unshift(transaction);
  return { transaction, success: status === "completed" };
}

/** Create a pending transaction for Stripe PaymentIntent (before client confirms) */
export function createPendingTransaction(
  stripePaymentIntentId: string,
  params: ProcessPaymentParams
): Transaction {
  const transaction: Transaction = {
    id: generateId(),
    amount: params.amount,
    currency: params.currency,
    recipient: params.recipient,
    description: params.description ?? "",
    status: "pending",
    createdAt: new Date().toISOString(),
    stripePaymentIntentId,
  };
  transactions.unshift(transaction);
  byStripePaymentIntentId.set(stripePaymentIntentId, transaction);
  return transaction;
}

/** Mark transaction as completed (called from webhook or confirm callback) */
export function completeTransaction(stripePaymentIntentId: string): Transaction | null {
  const transaction = byStripePaymentIntentId.get(stripePaymentIntentId);
  if (!transaction) return null;
  transaction.status = "completed";
  return transaction;
}

/** Mark transaction as refunded */
export function markTransactionRefunded(transactionId: string): Transaction | null {
  const transaction = transactions.find((t) => t.id === transactionId);
  if (!transaction || transaction.status !== "completed") return null;
  transaction.status = "refunded";
  transaction.refundedAt = new Date().toISOString();
  return transaction;
}

/** Update transaction note */
export function updateTransactionNote(transactionId: string, note: string): Transaction | null {
  const transaction = transactions.find((t) => t.id === transactionId);
  if (!transaction) return null;
  transaction.note = note.trim() || undefined;
  return transaction;
}
