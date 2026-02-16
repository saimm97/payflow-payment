import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listScheduledByUser, createScheduled } from "@/lib/scheduled-payment-store";
import { createPaymentSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const list = listScheduledByUser(session.user.id);
    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to list scheduled:", error);
    return NextResponse.json({ message: "Failed to load scheduled payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse({
      ...body,
      amount: typeof body.amount === "number" ? body.amount : parseFloat(body.amount),
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat().join(" ") || "Validation failed";
      return NextResponse.json({ message, errors: parsed.error.flatten() }, { status: 400 });
    }
    const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor : undefined;
    if (!scheduledFor || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
      return NextResponse.json({ message: "Valid scheduledFor date (YYYY-MM-DD) is required" }, { status: 400 });
    }
    const date = new Date(scheduledFor);
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) {
      return NextResponse.json({ message: "scheduledFor must be a future date" }, { status: 400 });
    }
    const { amount, currency, recipient, description, category } = parsed.data;
    const item = createScheduled(session.user.id, {
      amount,
      currency,
      recipient,
      description,
      category,
      scheduledFor,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create scheduled payment:", error);
    return NextResponse.json({ message: "Failed to schedule payment" }, { status: 500 });
  }
}
