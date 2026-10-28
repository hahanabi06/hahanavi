import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.slice(0, 500) : "";

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  await supabase.from("page_views").insert({ path });

  return NextResponse.json({ ok: true });
}
