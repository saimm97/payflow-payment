import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPaymentLink, listPaymentLinksByUserId } from "@/lib/payment-link-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const links = listPaymentLinksByUserId(session.user.id);
    return NextResponse.json(links);
  } catch (error) {
    console.error("Failed to list payment links:", error);
    return NextResponse.json({ message: "Failed to load links" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { amount, currency, recipient, description } = body;
    if (
      typeof amount !== "number" ||
      amount <= 0 ||
      typeof currency !== "string" ||
      typeof recipient !== "string" ||
      recipient.trim().length < 2
    ) {
      return NextResponse.json(
        { message: "amount (positive number), currency, and recipient required" },
        { status: 400 }
      );
    }
    const link = createPaymentLink({
      userId: session.user.id,
      amount,
      currency: currency.slice(0, 3),
      recipient: recipient.trim(),
      description: typeof description === "string" ? description.trim() : undefined,
    });
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.json({
      ...link,
      url: `${baseUrl}/pay/link/${link.id}`,
    });
  } catch (error) {
    console.error("Failed to create payment link:", error);
    return NextResponse.json({ message: "Failed to create link" }, { status: 500 });
  }
}
