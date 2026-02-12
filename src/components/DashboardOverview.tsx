"use client";

import Link from "next/link";
import { useTransactions } from "@/hooks/use-transactions";
import { Card, CardHeader } from "./Card";
import { TransactionList } from "./TransactionList";

const MOCK_BALANCE = 12450.75;

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

export function DashboardOverview() {
  const { transactions, loading, error } = useTransactions();
  const completed = transactions.filter((t) => t.status === "completed");
  const total = completed.reduce((sum, t) => sum + t.amount, 0);
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
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
            subtext="Completed payments"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />
          <StatCard
            label="Transactions"
            value={String(transactions.length)}
            subtext="All time"
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
            value={String(transactions.filter((t) => t.status === "pending").length)}
            subtext="Awaiting completion"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </section>

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
