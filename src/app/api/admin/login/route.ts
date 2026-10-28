import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminToken } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const token = await getAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
