import type { Recipient } from "@/types";

const recipients = new Map<string, Recipient>();

function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createRecipient(data: {
  userId: string;
  name: string;
  email?: string;
  accountNumber?: string;
}): Recipient {
  const recipient: Recipient = {
    id: generateId(),
    userId: data.userId,
    name: data.name.trim(),
    email: data.email?.trim(),
    accountNumber: data.accountNumber?.trim(),
    createdAt: new Date().toISOString(),
  };
  recipients.set(recipient.id, recipient);
  return recipient;
}

export function listRecipientsByUserId(userId: string): Recipient[] {
  return [...recipients.values()]
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteRecipient(id: string, userId: string): boolean {
  const r = recipients.get(id);
  if (!r || r.userId !== userId) return false;
  recipients.delete(id);
  return true;
}

export function getRecipient(id: string, userId: string): Recipient | undefined {
  const r = recipients.get(id);
  return r && r.userId === userId ? r : undefined;
}
