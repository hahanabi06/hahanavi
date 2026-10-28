import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature, replyToLine, WELCOME_MESSAGE } from "@/lib/line";
import { parseMessage, diagnose } from "@/lib/diagnosis";

export const dynamic = "force-dynamic";

type LineEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
};

function formatDiagnosisReply(text: string): string {
  const input = parseMessage(text);
  const result = diagnose(input);

  if (result.missingInfo.length > 0) {
    return `ごめん、もう少し情報が欲しいな。足りないのは「${result.missingInfo.join("、")}」だよ。\n\n例: 台東区 子供2人 年収300万\nみたいな形で送ってみてね。`;
  }

  const lines = result.items.map((item) => {
    const amount = item.monthlyYen ? `(月${item.monthlyYen.toLocaleString()}円)` : "";
    return `・${item.name}: ${item.status}${amount}\n  ${item.note}`;
  });

  const totalLine =
    result.totalMonthlyYen > 0
      ? `\n\nここまでで合計、月${result.totalMonthlyYen.toLocaleString()}円くらいになりそうだよ(全部支給の制度のみの概算)。`
      : "";

  return `診断したよ!\n\n${lines.join("\n\n")}${totalLine}\n\nこれは年収ベースの概算だよ。正式な判定は窓口で確認してね。`;
}

export async function POST(req: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !channelAccessToken) {
    return NextResponse.json(
      { error: "LINE credentials not configured" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature, channelSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as { events: LineEvent[] };

  await Promise.all(
    body.events.map(async (event) => {
      if (!event.replyToken) return;

      if (event.type === "follow") {
        await replyToLine(event.replyToken, WELCOME_MESSAGE, channelAccessToken);
        return;
      }

      if (event.type === "message" && event.message?.type === "text") {
        const reply = formatDiagnosisReply(event.message.text ?? "");
        await replyToLine(event.replyToken, reply, channelAccessToken);
      }
    })
  );

  return NextResponse.json({ ok: true });
}
