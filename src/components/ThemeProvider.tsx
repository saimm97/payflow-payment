"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const THEME_KEY = "payflow-theme";

function getEffectiveTheme(theme: string): "dark" | "light" {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as string | null;
    const theme = stored || "system";
    const effective = getEffectiveTheme(theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(effective);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (data.theme) {
          localStorage.setItem(THEME_KEY, data.theme);
          const effective = getEffectiveTheme(data.theme);
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(effective);
        }
      })
      .catch(() => {});
  }, [status]);

  return <>{children}</>;
}

export function setTheme(theme: string) {
  localStorage.setItem(THEME_KEY, theme);
  const effective = getEffectiveTheme(theme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(effective);
}
