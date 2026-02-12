import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRecipient, listRecipientsByUserId } from "@/lib/recipient-store";
import { recipientSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const recipients = listRecipientsByUserId(session.user.id);
    return NextResponse.json(recipients);
  } catch (error) {
    console.error("Failed to list recipients:", error);
    return NextResponse.json({ message: "Failed to load recipients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = recipientSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat().join(" ") || "Validation failed";
      return NextResponse.json({ message, errors: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const recipient = createRecipient({
      userId: session.user.id,
      name: data.name,
      email: data.email || undefined,
      accountNumber: data.accountNumber || undefined,
    });
    return NextResponse.json(recipient, { status: 201 });
  } catch (error) {
    console.error("Failed to create recipient:", error);
    return NextResponse.json({ message: "Failed to add recipient" }, { status: 500 });
  }
}
