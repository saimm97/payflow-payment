import type { Notification, NotificationType } from "@/types";

const notifications = new Map<string, Notification>();

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
}): Notification {
  const notif: Notification = {
    id: generateId(),
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    read: false,
    metadata: data.metadata,
    createdAt: new Date().toISOString(),
  };
  notifications.set(notif.id, notif);
  return notif;
}

export function listNotificationsByUserId(userId: string): Notification[] {
  return [...notifications.values()]
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markAsRead(id: string, userId: string): boolean {
  const n = notifications.get(id);
  if (!n || n.userId !== userId) return false;
  n.read = true;
  return true;
}

export function markAllAsRead(userId: string): number {
  let count = 0;
  notifications.forEach((n) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      count++;
    }
  });
  return count;
}
