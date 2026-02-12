import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
export const stripeEnabled = Boolean(secret);

export const stripe = secret ? new Stripe(secret, { typescript: true }) : null;

export function amountToCents(amount: number, currency: string): number {
  const zeroDecimal = ["jpy", "krw", "vnd", "clp", "xof"];
  const code = currency.toLowerCase();
  if (zeroDecimal.includes(code)) return Math.round(amount);
  return Math.round(amount * 100);
}
