import type { MoneyRequest, MoneyRequestStatus } from "@/types";

const requests = new Map<string, MoneyRequest>();

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createMoneyRequest(data: {
  userId: string;
  fromName: string;
  amount: number;
  currency: string;
  description?: string;
}): MoneyRequest {
  const req: MoneyRequest = {
    id: generateId(),
    userId: data.userId,
    fromName: data.fromName.trim(),
    amount: data.amount,
    currency: data.currency,
    description: data.description?.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.set(req.id, req);
  return req;
}

export function listMoneyRequestsByUserId(userId: string): MoneyRequest[] {
  return [...requests.values()]
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateMoneyRequestStatus(
  id: string,
  userId: string,
  status: MoneyRequestStatus
): MoneyRequest | null {
  const r = requests.get(id);
  if (!r || r.userId !== userId) return null;
  r.status = status;
  return r;
}
