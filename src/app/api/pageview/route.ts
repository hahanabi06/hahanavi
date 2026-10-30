import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isOwnerRequest } from "@/lib/admin-auth";
import { hasNoTrackCookie } from "@/lib/no-track";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.slice(0, 500) : "";
  const visitorId =
    typeof body?.visitorId === "string" ? body.visitorId.slice(0, 100) : null;
  const referrer =
    typeof body?.referrer === "string" ? body.referrer.slice(0, 500) : null;

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  // Claudeの内蔵ブラウザ(開発・動作確認で使う)や、リンクプレビュー用のbot・
  // クローラーからのアクセスは、アクセス解析には含めない
  const userAgent = req.headers.get("user-agent") ?? "";
  const isBot =
    userAgent.includes("Claude/") ||
    /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptimerobot/i.test(
      userAgent
    );
  if (isBot || hasNoTrackCookie(req) || (await isOwnerRequest(req))) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("page_views")
    .insert({
      path,
      visitor_id: visitorId,
      user_agent: userAgent.slice(0, 300),
      referrer,
    });
  if (error) console.error("[page_views] insert failed", error);

  return NextResponse.json({ ok: true });
}
