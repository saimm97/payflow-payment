import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, stripeEnabled, amountToCents } from "@/lib/stripe";
import { createPendingTransaction } from "@/lib/payment-service";
import { createPaymentSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!stripeEnabled || !stripe) {
    return NextResponse.json({ message: "Stripe is not configured" }, { status: 503 });
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat().join(" ") || "Validation failed";
      return NextResponse.json({ message, errors: parsed.error.flatten() }, { status: 400 });
    }

    const { amount, currency, recipient, description, category } = parsed.data;
    const amountInCents = amountToCents(amount, currency);
    if (amountInCents < 50) {
      return NextResponse.json({ message: "Minimum amount is 0.50" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        recipient,
        description: description ?? "",
        userId: session.user.id,
      },
    });

    const transaction = createPendingTransaction(paymentIntent.id, {
      amount,
      currency,
      recipient,
      description,
      category,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Create intent failed:", error);
    return NextResponse.json(
      { message: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
