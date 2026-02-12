import type { Transaction, TransactionStatus } from "@/types";

/**
 * In-memory payment service for demo purposes.
 * Replace with real payment provider (Stripe, etc.) and persistence in production.
 */

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

function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function listTransactions(): Promise<Transaction[]> {
  return [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export interface ProcessPaymentParams {
  amount: number;
  currency: string;
  recipient: string;
  description?: string;
}

export async function processPayment(
  params: ProcessPaymentParams
): Promise<{ transaction: Transaction; success: boolean }> {
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
