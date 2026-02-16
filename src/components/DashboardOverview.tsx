"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useTransactions } from "@/hooks/use-transactions";
import { Card, CardHeader } from "./Card";
import { TransactionList } from "./TransactionList";
import type { Transaction } from "@/types";

const MOCK_BALANCE = 12450.75;

const PERIODS = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "all", label: "All time", days: null as number | null },
] as const;

function StatCard({
  label,
  value,
  icon,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-surface-800 bg-surface-800/40 p-6 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">{value}</p>
          {subtext && <p className="mt-1 text-xs text-surface-500">{subtext}</p>}
        </div>
        <div className="rounded-lg bg-brand-500/10 p-2.5 text-brand-400">{icon}</div>
      </div>
    </div>
  );
}

function filterByPeriod(transactions: Transaction[], days: number | null): Transaction[] {
  if (days === null) return transactions;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return transactions.filter((t) => new Date(t.createdAt).getTime() >= cutoff);
}

export function DashboardOverview() {
  const { transactions, loading, error } = useTransactions();
  const [period, setPeriod] = useState<typeof PERIODS[number]["value"]>("30d");
  const [monthlyLimit, setMonthlyLimit] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (typeof data.monthlySpendingLimit === "number" && data.monthlySpendingLimit > 0) {
          setMonthlyLimit(data.monthlySpendingLimit);
        } else {
          setMonthlyLimit(null);
        }
      })
      .catch(() => setMonthlyLimit(null));
  }, []);

  const periodConfig = PERIODS.find((p) => p.value === period) ?? PERIODS[2];
  const filtered = useMemo(
    () => filterByPeriod(transactions, periodConfig.days),
    [transactions, periodConfig.days]
  );
  const completed = filtered.filter((t) => t.status === "completed");
  const total = completed.reduce((sum, t) => sum + t.amount, 0);
  const recent = filtered.slice(0, 5);

  const currentMonthSpent = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return transactions
      .filter((t) => t.status === "completed")
      .filter((t) => {
        const tms = new Date(t.createdAt).getTime();
        return tms >= start && tms <= end;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const uniqueRecipients = useMemo(() => {
    const seen = new Set<string>();
    return transactions
      .filter((t) => t.status === "completed")
      .filter((t) => {
        if (seen.has(t.recipient)) return false;
        seen.add(t.recipient);
        return true;
      })
      .slice(0, 3);
  }, [transactions]);

  const spendingByMonth = useMemo(() => {
    const byMonth: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = 0;
    }
    transactions
      .filter((t) => t.status === "completed")
      .forEach((t) => {
        const d = new Date(t.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (byMonth[key] !== undefined) byMonth[key] += t.amount;
      });
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  }, [transactions]);
  const maxSpending = Math.max(1, ...spendingByMonth.map(([, v]) => v));

  const spendingByCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    completed.forEach((t) => {
      const key = t.category || "Uncategorized";
      byCategory[key] = (byCategory[key] ?? 0) + t.amount;
    });
    return Object.entries(byCategory).sort(([, a], [, b]) => b - a);
  }, [completed]);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-xl border border-surface-800 bg-surface-800/40 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-brand-500/20 text-brand-400"
                  : "text-surface-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>
      {uniqueRecipients.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-surface-400 mb-2">Quick pay</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueRecipients.map((t) => (
              <Link
                key={t.id}
                href={`/pay?recipient=${encodeURIComponent(t.recipient)}`}
                className="rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-2 text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-700/80 transition-colors"
              >
                Pay {t.recipient}
              </Link>
            ))}
          </div>
        </section>
      )}
      {monthlyLimit != null && monthlyLimit > 0 && (
        <section className="rounded-xl border border-surface-800 bg-surface-800/40 p-4">
          <h2 className="text-sm font-medium text-surface-400 mb-2">Monthly budget</h2>
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-sm text-surface-300">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(currentMonthSpent)}
              {" / "}
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(monthlyLimit)}
            </span>
            <span className={`text-sm font-medium ${currentMonthSpent >= monthlyLimit ? "text-red-400" : "text-surface-400"}`}>
              {Math.round((currentMonthSpent / monthlyLimit) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${currentMonthSpent >= monthlyLimit ? "bg-red-500" : "bg-brand-500"}`}
              style={{ width: `${Math.min(100, (currentMonthSpent / monthlyLimit) * 100)}%` }}
              role="progressbar"
              aria-valuenow={currentMonthSpent}
              aria-valuemin={0}
              aria-valuemax={monthlyLimit}
            />
          </div>
          <p className="text-xs text-surface-500 mt-1">
            {currentMonthSpent >= monthlyLimit
              ? "You’ve reached your monthly limit. Adjust in Settings if needed."
              : "Spending this month. Set or change limit in Settings."}
          </p>
        </section>
      )}
      <section>
        <h2 className="sr-only">Summary</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Available balance"
            value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(MOCK_BALANCE)}
            subtext="Current balance"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            }
          />
          <StatCard
            label="Total sent"
            value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(total)}
            subtext={periodConfig.label}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />
          <StatCard
            label="Transactions"
            value={String(filtered.length)}
            subtext={periodConfig.label}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Completed"
            value={String(completed.length)}
            subtext="Successful payments"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Pending"
            value={String(filtered.filter((t) => t.status === "pending").length)}
            subtext="Awaiting completion"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </section>

      <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Spending overview</h2>
          <p className="text-sm text-surface-400 mb-6">Last 6 months (completed payments)</p>
          <div
            className="flex items-end gap-3 h-[140px] pb-6"
            style={{ minHeight: 140 }}
            role="img"
            aria-label="Bar chart of spending by month"
          >
            {spendingByMonth.map(([label, value]) => {
              const barHeight = maxSpending > 0 ? Math.max(8, (value / maxSpending) * 120) : 0;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="w-full flex flex-col items-center justify-end h-[120px]">
                    <div
                      className="w-full max-w-[48px] rounded-t bg-brand-500 transition-all min-h-[8px]"
                      style={{ height: `${barHeight}px` }}
                      title={value > 0 ? `${new Date(label + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}: $${value.toFixed(2)}` : `${new Date(label + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })}: $0`}
                    />
                  </div>
                  <span className="text-xs text-surface-500 font-medium truncate w-full text-center">
                    {new Date(label + "-01").toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

      {spendingByCategory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Spending by category</h2>
          <p className="text-sm text-surface-400 mb-4">{periodConfig.label}</p>
          <ul className="space-y-3" role="list">
            {spendingByCategory.map(([category, sum]) => {
              const pct = total > 0 ? (sum / total) * 100 : 0;
              return (
                <li key={category} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-surface-300 min-w-[120px] truncate">
                    {category}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden max-w-[200px]">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white tabular-nums min-w-[80px] text-right">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(sum)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            title="Recent transactions"
            subtitle="Latest activity on your account"
          action={
            <Link
              href="/transactions"
              className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all →
            </Link>
          }
        />
        <div className="p-6 pt-4">
          <TransactionList
            transactions={recent}
            loading={loading}
            error={error}
            emptyMessage="No transactions yet. Send your first payment to get started."
          />
          {!loading && recent.length === 0 && !error && (
            <Link
              href="/pay"
              className="mt-4 block text-center text-sm text-brand-400 hover:text-brand-300 font-medium"
            >
              Send your first payment →
            </Link>
          )}
        </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Activity" subtitle="Latest updates" />
          <div className="p-6 pt-0">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-surface-800/50" aria-hidden />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-surface-400 text-sm py-4">No activity yet.</p>
            ) : (
              <ul className="space-y-3" role="list">
                {transactions.slice(0, 5).map((tx) => (
                  <li key={tx.id} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">
                        Payment to {tx.recipient}
                        {tx.status === "completed" ? "" : ` (${tx.status})`}
                      </p>
                      <p className="text-surface-500 text-xs">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: tx.currency }).format(tx.amount)}
                        {" · "}
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
