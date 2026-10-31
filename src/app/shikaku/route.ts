import { NextResponse } from "next/server";

// 旧URL。ナビのリンクは無効化されていたため実際のアクセスはほぼ無い想定だが、
// 念のため新ページへ転送しておく
export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/shigoto", req.url));
}
