import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listNotificationsByUserId,
  createNotification,
  markAllAsRead,
} from "@/lib/notification-store";
import type { NotificationType } from "@/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const list = listNotificationsByUserId(session.user.id);
    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to list notifications:", error);
    return NextResponse.json({ message: "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { type, title, message, metadata } = body as {
      type: NotificationType;
      title: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };
    if (!type || !title) {
      return NextResponse.json({ message: "type and title required" }, { status: 400 });
    }
    const notif = createNotification({
      userId: session.user.id,
      type,
      title,
      message,
      metadata,
    });
    return NextResponse.json(notif, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json({ message: "Failed to create notification" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    if (body.readAll === true) {
      const count = markAllAsRead(session.user.id);
      return NextResponse.json({ marked: count });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}
