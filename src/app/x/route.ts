import { NextResponse } from "next/server";

// XのプロフィールのWebサイト欄に"hahanavi.com/x"とだけ書いてもらうための専用リンク。
// トップページへリダイレクトしつつ?from=xを付け、PageViewTrackerがXからの
// アクセスとして計測できるようにする(見た目はシンプルなまま計測も取れる)
export async function GET(req: Request) {
  const url = new URL("/", req.url);
  url.searchParams.set("from", "x");
  return NextResponse.redirect(url);
}
