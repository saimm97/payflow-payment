import { NextResponse } from "next/server";
import { getPaymentLink } from "@/lib/payment-link-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const link = getPaymentLink(id);
  if (!link) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }
  return NextResponse.json(link);
}
