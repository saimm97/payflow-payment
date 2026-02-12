import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/auth-store";
import { registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message = Object.values(first).flat().join(" ") || "Validation failed";
      return NextResponse.json({ message, errors: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    if (findUserByEmail(email)) {
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const user = createUser({ name, email, passwordHash });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
