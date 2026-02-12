import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processPayment } from "@/lib/payment-service";
import { createPaymentSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notification-store";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat().join(" ") || "Validation failed";
      return NextResponse.json(
        { message, errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { transaction, success } = await processPayment(parsed.data);

    if (session?.user?.id) {
      createNotification({
        userId: session.user.id,
        type: success ? "payment_success" : "payment_failed",
        title: success
          ? `Payment of ${transaction.currency} ${transaction.amount.toFixed(2)} sent to ${transaction.recipient}`
          : "Payment failed",
        message: success ? "Your payment was completed successfully." : "Please try again or contact support.",
        metadata: { transactionId: transaction.id },
      });
    }

    return NextResponse.json(
      { transaction, success },
      { status: success ? 201 : 422 }
    );
  } catch (error) {
    console.error("Payment failed:", error);
    return NextResponse.json(
      { message: "Payment processing failed" },
      { status: 500 }
    );
  }
}
