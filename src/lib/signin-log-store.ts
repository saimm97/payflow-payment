import type { SignInRecord } from "@/types";

const records = new Map<string, SignInRecord[]>();

function generateId(): string {
  return `signin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function addSignIn(userId: string, ip?: string, device?: string): SignInRecord {
  const record: SignInRecord = {
    id: generateId(),
    userId,
    ip: ip ?? "—",
    device: device ?? "Web",
    createdAt: new Date().toISOString(),
  };
  const list = records.get(userId) ?? [];
  list.unshift(record);
  records.set(userId, list.slice(0, 20));
  return record;
}

export function listSignIns(userId: string): SignInRecord[] {
  return records.get(userId) ?? [];
}
