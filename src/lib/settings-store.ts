export type Theme = "dark" | "light" | "system";

export interface UserSettings {
  defaultCurrency: string;
  notificationsEnabled: boolean;
  theme: Theme;
  /** Optional monthly spending limit (e.g. 5000). Used for budget bar on dashboard. */
  monthlySpendingLimit?: number;
}

/**
 * In-memory user preferences. Replace with DB in production.
 */
const settings = new Map<string, UserSettings>();

const DEFAULTS: UserSettings = { defaultCurrency: "USD", notificationsEnabled: true, theme: "system" };

export function getSettings(userId: string): UserSettings {
  return settings.get(userId) ?? { ...DEFAULTS };
}

export function updateSettings(
  userId: string,
  patch: { defaultCurrency?: string; notificationsEnabled?: boolean; theme?: Theme; monthlySpendingLimit?: number }
): UserSettings {
  const current = settings.get(userId) ?? { ...DEFAULTS };
  const next = { ...current, ...patch };
  if (patch.monthlySpendingLimit !== undefined) {
    next.monthlySpendingLimit = patch.monthlySpendingLimit > 0 ? patch.monthlySpendingLimit : undefined;
  }
  settings.set(userId, next);
  return next;
}
