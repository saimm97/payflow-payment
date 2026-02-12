import { NextResponse } from "next/server";
import { stripeEnabled } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json({
    stripeEnabled,
    publishableKey: stripeEnabled ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null : null,
  });
}
