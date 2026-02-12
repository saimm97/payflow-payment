import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markAsRead } from "@/lib/notification-store";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const ok = markAsRead(id, session.user.id);
    if (!ok) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification read:", error);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}
