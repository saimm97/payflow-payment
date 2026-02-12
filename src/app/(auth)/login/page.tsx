"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      if (res?.ok) {
        window.location.href = callbackUrl;
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-semibold text-white">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-mono font-bold text-surface-950">
            P
          </span>
          PayFlow
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Sign in</h1>
      <p className="text-surface-400 text-sm mb-6">Enter your credentials to access your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            required
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 font-semibold text-surface-950 hover:from-brand-400 hover:to-brand-500 focus-ring disabled:opacity-50 transition-all"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
          Create one
        </Link>
      </p>
    </Card>
  );
}
