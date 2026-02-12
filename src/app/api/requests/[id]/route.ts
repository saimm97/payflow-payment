import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateMoneyRequestStatus } from "@/lib/money-request-store";
import type { MoneyRequestStatus } from "@/types";

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
    const body = await request.json();
    const status = body.status as MoneyRequestStatus;
    if (!["pending", "paid", "cancelled"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
    const updated = updateMoneyRequestStatus(id, session.user.id, status);
    if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update request:", error);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}
