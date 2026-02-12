import type { PaymentLink } from "@/types";

const links = new Map<string, PaymentLink>();

function generateId(): string {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createPaymentLink(data: {
  userId: string;
  amount: number;
  currency: string;
  recipient: string;
  description?: string;
}): PaymentLink {
  const link: PaymentLink = {
    id: generateId(),
    userId: data.userId,
    amount: data.amount,
    currency: data.currency,
    recipient: data.recipient,
    description: data.description,
    createdAt: new Date().toISOString(),
  };
  links.set(link.id, link);
  return link;
}

export function getPaymentLink(id: string): PaymentLink | undefined {
  return links.get(id);
}

export function listPaymentLinksByUserId(userId: string): PaymentLink[] {
  return [...links.values()]
    .filter((l) => l.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
