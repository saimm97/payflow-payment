import type { ScheduledPayment, ScheduledPaymentStatus } from "@/types";

const scheduled: ScheduledPayment[] = [];

function generateId(): string {
  return `sched_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function listScheduledByUser(userId: string): ScheduledPayment[] {
  return [...scheduled]
    .filter((s) => s.userId === userId && s.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

export function getScheduledById(id: string): ScheduledPayment | undefined {
  return scheduled.find((s) => s.id === id);
}

export function createScheduled(
  userId: string,
  params: {
    amount: number;
    currency: string;
    recipient: string;
    description?: string;
    category?: string;
    scheduledFor: string;
  }
): ScheduledPayment {
  const item: ScheduledPayment = {
    id: generateId(),
    userId,
    amount: params.amount,
    currency: params.currency,
    recipient: params.recipient,
    description: params.description,
    category: params.category,
    scheduledFor: params.scheduledFor,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  scheduled.push(item);
  return item;
}

export function updateScheduledStatus(
  id: string,
  status: ScheduledPaymentStatus
): ScheduledPayment | null {
  const item = scheduled.find((s) => s.id === id);
  if (!item) return null;
  item.status = status;
  return item;
}

export function deleteScheduled(id: string): boolean {
  const idx = scheduled.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  scheduled.splice(idx, 1);
  return true;
}
