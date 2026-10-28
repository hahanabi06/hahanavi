import { NextResponse } from "next/server";
import { pushToLine } from "@/lib/line";

export async function POST(req: Request) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    return NextResponse.json(
      { error: "LINE credentials not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const lineUserId =
    typeof body?.lineUserId === "string" ? body.lineUserId : "";
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!lineUserId || !message) {
    return NextResponse.json(
      { error: "lineUserId and message are required" },
      { status: 400 }
    );
  }

  const result = await pushToLine(lineUserId, message, channelAccessToken);
  if (!result.ok) {
    console.error("[line-push] failed", lineUserId, result.error);
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
