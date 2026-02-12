import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { getTransactionById, markTransactionRefunded } from "@/lib/payment-service";
import { createNotification } from "@/lib/notification-store";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId } = body;
    if (!transactionId || typeof transactionId !== "string") {
      return NextResponse.json({ message: "transactionId required" }, { status: 400 });
    }

    const transaction = getTransactionById(transactionId);
    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }
    if (transaction.status !== "completed") {
      return NextResponse.json(
        { message: "Only completed transactions can be refunded" },
        { status: 400 }
      );
    }
    if (transaction.refundedAt) {
      return NextResponse.json({ message: "Already refunded" }, { status: 400 });
    }

    if (transaction.stripePaymentIntentId && stripeEnabled && stripe) {
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
      const chargeId = typeof paymentIntent.latest_charge === "string"
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id;
      if (chargeId) {
        await stripe.refunds.create({ charge: chargeId });
      }
    }

    const updated = markTransactionRefunded(transactionId);
    if (updated && session.user.id) {
      createNotification({
        userId: session.user.id,
        type: "system",
        title: `Refund processed for ${updated.currency} ${updated.amount.toFixed(2)} to ${updated.recipient}`,
        message: "The refund has been submitted.",
        metadata: { transactionId: updated.id },
      });
    }

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error("Refund failed:", error);
    return NextResponse.json(
      { message: "Refund failed. Please try again or contact support." },
      { status: 500 }
    );
  }
}
