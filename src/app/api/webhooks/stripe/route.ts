import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { completeTransaction, getTransactionByStripePaymentIntentId } from "@/lib/payment-service";
import { createNotification } from "@/lib/notification-store";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripeEnabled || !stripe || !webhookSecret) {
    return NextResponse.json({ message: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ message: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const transaction = completeTransaction(pi.id);
    if (transaction) {
      const userId = pi.metadata?.userId;
      if (userId) {
        createNotification({
          userId,
          type: "payment_success",
          title: `Payment of ${transaction.currency} ${transaction.amount.toFixed(2)} sent to ${transaction.recipient}`,
          message: "Your payment was completed successfully.",
          metadata: { transactionId: transaction.id },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
