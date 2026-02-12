/**
 * Domain types for the payment application.
 * Kept in a single module for consistency and easy imports.
 */

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  recipient: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
  /** Set when payment was processed via Stripe */
  stripePaymentIntentId?: string;
  /** Set when transaction was refunded */
  refundedAt?: string;
  /** User-added note */
  note?: string;
}

export interface PaymentLink {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  recipient: string;
  description?: string;
  createdAt: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  recipient: string;
  description: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface Recipient {
  id: string;
  userId: string;
  name: string;
  email?: string;
  accountNumber?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  type: "payment_sent" | "payment_received" | "recipient_added";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType = "payment_success" | "payment_failed" | "request_received" | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type MoneyRequestStatus = "pending" | "paid" | "cancelled";

export interface MoneyRequest {
  id: string;
  userId: string;
  fromName: string;
  amount: number;
  currency: string;
  description?: string;
  status: MoneyRequestStatus;
  createdAt: string;
}

export interface SignInRecord {
  id: string;
  userId: string;
  ip?: string;
  device?: string;
  createdAt: string;
}
