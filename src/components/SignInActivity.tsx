"use client";

import { useState, useEffect } from "react";
import type { SignInRecord } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SignInActivity() {
  const [list, setList] = useState<SignInRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity/signins")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-surface-800/50" />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return <p className="text-surface-400 text-sm">No sign-in history yet.</p>;
  }

  return (
    <ul className="space-y-2" role="list">
      {list.slice(0, 10).map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-surface-800 bg-surface-800/40 px-4 py-3 text-sm"
        >
          <div>
            <p className="text-white font-medium">{r.device ?? "Web"}</p>
            <p className="text-surface-500 text-xs">{r.ip ?? "—"}</p>
          </div>
          <span className="text-surface-400 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
