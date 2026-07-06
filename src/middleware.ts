import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { internalSessionCookieName, verifyInternalSessionCookie } from "@/lib/auth/internal-auth";

export async function middleware(request: NextRequest) {
  const protectedRoutes = ["/dashboard", "/roadmap", "/content-review"];
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (!isProtectedRoute || !process.env.APP_PASSWORD) {
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
  matcher: ["/dashboard/:path*", "/roadmap/:path*", "/content-review/:path*"]
};
