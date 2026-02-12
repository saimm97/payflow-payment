import type { User } from "@/types";

/**
 * In-memory user store for demo. Replace with database in production.
 */
const users = new Map<string, User>();

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
}): User {
  const user: User = {
    id: generateId(),
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.toLowerCase().trim();
  return [...users.values()].find((u) => u.email === normalized);
}

export function findUserById(id: string): User | undefined {
  return users.get(id);
}
