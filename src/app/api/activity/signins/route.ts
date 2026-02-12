import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listSignIns } from "@/lib/signin-log-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const list = listSignIns(session.user.id);
    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to list sign-ins:", error);
    return NextResponse.json({ message: "Failed to load activity" }, { status: 500 });
  }
}
