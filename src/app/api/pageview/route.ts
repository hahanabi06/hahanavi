import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.slice(0, 500) : "";
  const visitorId =
    typeof body?.visitorId === "string" ? body.visitorId.slice(0, 100) : null;

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  // Claudeの内蔵ブラウザ(開発・動作確認で使う)からのアクセスは、
  // User-Agentに"Claude/"が入るのでアクセス解析からは除外する
  const userAgent = req.headers.get("user-agent") ?? "";
  if (userAgent.includes("Claude/")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("page_views")
    .insert({ path, visitor_id: visitorId });
  if (error) console.error("[page_views] insert failed", error);

  return NextResponse.json({ ok: true });
}
