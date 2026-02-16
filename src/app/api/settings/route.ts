import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings, type Theme } from "@/lib/settings-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const settings = getSettings(session.user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json({ message: "Failed to load settings" }, { status: 500 });
  }
}

const THEMES: Theme[] = ["dark", "light", "system"];

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { defaultCurrency, notificationsEnabled, theme, monthlySpendingLimit } = body;
    const patch: { defaultCurrency?: string; notificationsEnabled?: boolean; theme?: Theme; monthlySpendingLimit?: number } = {};
    if (typeof defaultCurrency === "string" && defaultCurrency.length === 3) {
      patch.defaultCurrency = defaultCurrency;
    }
    if (typeof notificationsEnabled === "boolean") {
      patch.notificationsEnabled = notificationsEnabled;
    }
    if (THEMES.includes(theme)) {
      patch.theme = theme;
    }
    if (monthlySpendingLimit !== undefined) {
      const num = Number(monthlySpendingLimit);
      patch.monthlySpendingLimit = Number.isFinite(num) && num >= 0 ? num : undefined;
    }
    const next = updateSettings(session.user.id, patch);
    return NextResponse.json(next);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
}
