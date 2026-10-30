import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const idea = typeof body?.idea === "string" ? body.idea.trim() : "";

  if (!idea) {
    return NextResponse.json({ error: "idea is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("article_ideas").insert({ idea });
  if (error) {
    console.error("[article_ideas] insert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// 記事化済み・不要になったアイデアを一覧から消す(却下)ために使う
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "number" ? body.id : null;
  const status = typeof body?.status === "string" ? body.status : "";

  if (!id || !["done", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "id and valid status are required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("article_ideas")
    .update({ status, processed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[article_ideas] update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
