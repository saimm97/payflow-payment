import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings-store";

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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { defaultCurrency, notificationsEnabled } = body;
    const patch: { defaultCurrency?: string; notificationsEnabled?: boolean } = {};
    if (typeof defaultCurrency === "string" && defaultCurrency.length === 3) {
      patch.defaultCurrency = defaultCurrency;
    }
    if (typeof notificationsEnabled === "boolean") {
      patch.notificationsEnabled = notificationsEnabled;
    }
    const next = updateSettings(session.user.id, patch);
    return NextResponse.json(next);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
}
