"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Card } from "@/components/Card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (signInRes?.ok) {
        window.location.href = "/";
        return;
      }
      setError("Account created. Please sign in.");
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
      <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
      <p className="text-surface-400 text-sm mb-6">Register to start sending and tracking payments.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Full name</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base"
            required
            minLength={2}
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            required
            minLength={8}
          />
          <p className="mt-1 text-xs text-surface-500">At least 8 characters</p>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-surface-300 mb-1">Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-base"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 font-semibold text-surface-950 hover:from-brand-400 hover:to-brand-500 focus-ring disabled:opacity-50 transition-all"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-400">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
