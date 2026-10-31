import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const programId = typeof body?.programId === "string" ? body.programId : null;
  const programName = typeof body?.programName === "string" ? body.programName : null;
  const source =
    body?.source === "homepage_request"
      ? "homepage_request"
      : body?.source === "article"
        ? "article"
        : body?.source === "job"
          ? "job"
          : "program_detail";

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("program_reports").insert({
    program_id: programId,
    program_name: programName,
    message,
    source,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
