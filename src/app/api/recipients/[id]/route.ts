import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteRecipient } from "@/lib/recipient-store";

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
    const deleted = deleteRecipient(id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ message: "Recipient not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recipient:", error);
    return NextResponse.json({ message: "Failed to delete recipient" }, { status: 500 });
  }
}
