import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/pay/link/")) return NextResponse.next();
  return withAuth({ pages: { signIn: "/login" } })(request);
}

export const config = {
  matcher: ["/", "/pay", "/pay/link/:path*", "/transactions", "/profile", "/recipients", "/settings", "/help", "/requests", "/payment-links"],
};
