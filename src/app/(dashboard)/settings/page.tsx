"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

const CURRENCIES = ["USD", "EUR", "GBP"];

export default function SettingsPage() {
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency);
        if (typeof data.notificationsEnabled === "boolean") setNotificationsEnabled(data.notificationsEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultCurrency,
          notificationsEnabled,
        }),
      });
      if (res.ok) {
        setMessage("saved");
        setTimeout(() => setMessage(null), 3000);
      } else setMessage("error");
    } catch {
      setMessage("error");
    }
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account preferences and defaults."
        breadcrumbs={[{ label: "Settings" }]}
      />
      <div className="max-w-2xl space-y-6">
        {message === "saved" && (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-brand-400 text-sm animate-fade-in" role="status">
            Settings saved.
          </div>
        )}
        {message === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
            Failed to save. Try again.
          </div>
        )}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-surface-800/50 rounded-xl" />
              <div className="h-12 bg-surface-800/50 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6">
              <label className="block">
                <span className="block text-sm font-medium text-surface-300 mb-2">Default currency</span>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="input-base max-w-[120px]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-300">Enable payment and activity notifications</span>
              </label>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-surface-950 hover:bg-brand-400 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
