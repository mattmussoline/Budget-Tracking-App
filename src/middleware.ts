import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { internalSessionCookieName, verifyInternalSessionCookie } from "@/lib/auth/internal-auth";

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/dashboard") || !process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const session = await verifyInternalSessionCookie(
    request.cookies.get(internalSessionCookieName)?.value,
    process.env.APP_PASSWORD
  );

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
