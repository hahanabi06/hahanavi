import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminToken } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/admin/login") ||
    req.nextUrl.pathname === "/api/admin/login"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expected = await getAdminToken();

  if (cookie !== expected) {
    if (req.nextUrl.pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
