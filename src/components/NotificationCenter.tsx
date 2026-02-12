"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Notification } from "@/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/80 transition-colors"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-surface-950 text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] overflow-hidden rounded-xl border border-surface-800 bg-surface-900 shadow-xl z-50 flex flex-col">
          <div className="p-4 border-b border-surface-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-surface-800/50 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-surface-400 text-sm text-center">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-surface-800">
                {notifications.slice(0, 20).map((n) => (
                  <li
                    key={n.id}
                    className={`p-4 hover:bg-surface-800/50 transition-colors ${!n.read ? "bg-brand-500/5" : ""}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        if (!n.read) markOne(n.id);
                      }}
                    >
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      {n.message && <p className="text-xs text-surface-400 mt-0.5">{n.message}</p>}
                      <p className="text-xs text-surface-500 mt-1">{formatTime(n.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-2 border-t border-surface-800">
            <Link
              href="/transactions"
              className="block text-center text-sm text-brand-400 hover:text-brand-300 py-2"
              onClick={() => setOpen(false)}
            >
              View all activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
