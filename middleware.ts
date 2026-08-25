import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("studio-session");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the session token structure (signed by our secret)
  const parts = sessionCookie.value.split(".");
  if (parts.length !== 2) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("studio-session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio", "/studio/:path*"],
};
