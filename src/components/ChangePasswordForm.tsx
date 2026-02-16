"use client";

import { useState } from "react";
import { Card } from "./Card";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password updated. Use your new password next time you sign in." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update password." });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Try again." });
    }
    setLoading(false);
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Change password</h2>
      <p className="text-surface-400 text-sm mb-4">
        Use a strong password that you don’t use elsewhere. You’ll need to sign in again after changing it.
      </p>
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm mb-4 ${
            message.type === "success"
              ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="input-base"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="input-base"
          />
          <p className="mt-1 text-xs text-surface-500">At least 8 characters</p>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="input-base"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 disabled:opacity-50 transition-colors"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </Card>
  );
}
