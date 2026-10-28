import { NextResponse } from "next/server";
import { NO_TRACK_COOKIE_NAME } from "@/lib/no-track";

// 運営者が自分の端末を一度だけこのURLにアクセスさせることで、
// その後の閲覧をアクセス解析(PV/UU・記事閲覧数)から継続的に除外できる
export async function GET(req: Request) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL("/", url));
  res.cookies.set(NO_TRACK_COOKIE_NAME, "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
