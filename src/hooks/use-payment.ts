"use client";

import { useState, useCallback } from "react";
import type { Transaction } from "@/types";

interface PaymentResult {
  transaction: Transaction;
  success: boolean;
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const submitPayment = useCallback(
    async (params: {
      amount: number;
      currency: string;
      recipient: string;
      description?: string;
    }) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? "Payment failed");
          return null;
        }
        setResult({ transaction: data.transaction, success: data.success });
        return data as PaymentResult;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Payment failed";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { submitPayment, loading, error, result, reset };
}
