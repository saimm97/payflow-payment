/**
 * In-memory user preferences. Replace with DB in production.
 */
const settings = new Map<string, { defaultCurrency: string; notificationsEnabled: boolean }>();

const DEFAULTS = { defaultCurrency: "USD", notificationsEnabled: true };

export function getSettings(userId: string) {
  return settings.get(userId) ?? { ...DEFAULTS };
}

export function updateSettings(
  userId: string,
  patch: { defaultCurrency?: string; notificationsEnabled?: boolean }
) {
  const current = settings.get(userId) ?? { ...DEFAULTS };
  const next = { ...current, ...patch };
  settings.set(userId, next);
  return next;
}
