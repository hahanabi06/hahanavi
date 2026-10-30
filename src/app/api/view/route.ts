import { NextResponse } from "next/server";
import { incrementArticleView } from "@/lib/article-stats";
import { isOwnerRequest } from "@/lib/admin-auth";
import { hasNoTrackCookie } from "@/lib/no-track";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const articleId = typeof body?.articleId === "string" ? body.articleId : null;
  if (!articleId) {
    return NextResponse.json({ error: "articleId is required" }, { status: 400 });
  }

  // /api/pageviewと同じ基準(Claude内蔵ブラウザ・クローラー等は除外)
  const userAgent = req.headers.get("user-agent") ?? "";
  const isBot =
    userAgent.includes("Claude/") ||
    /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptimerobot/i.test(
      userAgent
    );
  if (isBot || hasNoTrackCookie(req) || (await isOwnerRequest(req))) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  await incrementArticleView(articleId).catch(() => {});
  return NextResponse.json({ ok: true });
}
