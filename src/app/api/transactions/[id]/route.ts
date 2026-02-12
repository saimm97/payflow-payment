import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTransactionById, updateTransactionNote } from "@/lib/payment-service";

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
    const note = typeof body.note === "string" ? body.note : undefined;
    const transaction = getTransactionById(id);
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }
    const updated = updateTransactionNote(id, note ?? "");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}
