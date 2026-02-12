import { NextResponse } from "next/server";
import { listTransactions } from "@/lib/payment-service";

export async function GET() {
  try {
    const transactions = await listTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to list transactions:", error);
    return NextResponse.json(
      { message: "Failed to load transactions" },
      { status: 500 }
    );
  }
}
