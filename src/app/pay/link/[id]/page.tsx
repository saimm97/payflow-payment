"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PaymentForm } from "@/components/PaymentForm";
import type { PaymentLink } from "@/types";

export default function PaymentLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/payment-links/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Link not found");
        return res.json();
      })
      .then(setLink)
      .catch(() => setError("This payment link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-950 px-4">
        <div className="animate-pulse text-surface-400">Loading…</div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-950 px-4">
        <div className="max-w-md w-full rounded-2xl border border-surface-800 bg-surface-900 p-8 text-center">
          <p className="text-red-400">{error ?? "Link not found"}</p>
          <Link href="/login" className="mt-6 inline-block text-brand-400 hover:text-brand-300 text-sm font-medium">
            Go to PayFlow
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-950 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold text-white">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-mono font-bold text-surface-950">P</span>
            PayFlow
          </Link>
        </div>
        <div className="rounded-2xl border border-surface-800 bg-surface-900 p-6 mb-4">
          <h1 className="text-lg font-semibold text-white mb-1">Payment request</h1>
          <p className="text-surface-400 text-sm">
            {link.recipient} requests {new Intl.NumberFormat("en-US", { style: "currency", currency: link.currency }).format(link.amount)}
            {link.description && ` — ${link.description}`}
          </p>
        </div>
        {status === "loading" ? (
          <div className="rounded-2xl border border-surface-800 bg-surface-900 p-8 text-center text-surface-400">Loading…</div>
        ) : session ? (
          <PaymentForm
            prefilled={{
              amount: link.amount,
              currency: link.currency,
              recipient: link.recipient,
              description: link.description,
            }}
          />
        ) : (
          <div className="rounded-2xl border border-surface-800 bg-surface-900 p-8 text-center">
            <p className="text-surface-300 mb-6">Sign in to complete this payment.</p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/pay/link/${id}`)}`}
              className="inline-block rounded-xl bg-brand-500 px-6 py-3 font-semibold text-surface-950 hover:bg-brand-400 transition-colors"
            >
              Sign in
            </Link>
            <p className="mt-4 text-sm text-surface-500">
              Don&apos;t have an account? <Link href="/register" className="text-brand-400 hover:text-brand-300">Register</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
