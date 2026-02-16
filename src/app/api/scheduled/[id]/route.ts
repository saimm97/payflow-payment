import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScheduledById, updateScheduledStatus, deleteScheduled } from "@/lib/scheduled-payment-store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const item = getScheduledById(id);
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ message: "Scheduled payment not found" }, { status: 404 });
    }
    const body = await request.json();
    const status = body.status;
    if (status === "cancelled") {
      const updated = updateScheduledStatus(id, "cancelled");
      return NextResponse.json(updated);
    }
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update scheduled:", error);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const item = getScheduledById(id);
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ message: "Scheduled payment not found" }, { status: 404 });
    }
    deleteScheduled(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete scheduled:", error);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
