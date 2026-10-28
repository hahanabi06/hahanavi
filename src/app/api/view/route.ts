import { NextResponse } from "next/server";
import { incrementArticleView } from "@/lib/article-stats";
import { isOwnerRequest } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const articleId = typeof body?.articleId === "string" ? body.articleId : null;
  if (!articleId) {
    return NextResponse.json({ error: "articleId is required" }, { status: 400 });
  }
  if (await isOwnerRequest(req)) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  await incrementArticleView(articleId).catch(() => {});
  return NextResponse.json({ ok: true });
}
