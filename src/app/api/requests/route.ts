import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createMoneyRequest, listMoneyRequestsByUserId } from "@/lib/money-request-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const list = listMoneyRequestsByUserId(session.user.id);
    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to list requests:", error);
    return NextResponse.json({ message: "Failed to load requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { fromName, amount, currency, description } = body;
    if (!fromName || typeof amount !== "number" || amount <= 0 || !currency) {
      return NextResponse.json(
        { message: "fromName, amount (positive number), and currency required" },
        { status: 400 }
      );
    }
    const req = createMoneyRequest({
      userId: session.user.id,
      fromName: String(fromName).trim(),
      amount: Number(amount),
      currency: String(currency).slice(0, 3),
      description: description ? String(description) : undefined,
    });
    return NextResponse.json(req, { status: 201 });
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json({ message: "Failed to create request" }, { status: 500 });
  }
}
