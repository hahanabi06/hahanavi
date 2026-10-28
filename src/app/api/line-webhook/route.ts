import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature, replyToLine, WELCOME_MESSAGE } from "@/lib/line";
import { parseMessage, diagnose } from "@/lib/diagnosis";
import { getSupabaseServerClient } from "@/lib/supabase";

type LineEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
  source?: { type: string; userId?: string };
};

// Supabaseクライアントはクエリ失敗時に例外を投げず { error } を返すだけなので、
// try/catchだけだと書き込み失敗に気づけない。LINEの顧客データは生命線なので、
// 失敗は必ずログに残す(ユーザーへの返信は止めない = best-effortだが、サイレント失敗はさせない)。
async function touchLineUser(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  message?: { text: string; parsed: ReturnType<typeof parseMessage> }
) {
  try {
    const update: Record<string, unknown> = {
      line_user_id: userId,
      last_seen_at: new Date().toISOString(),
    };

    if (message) {
      const { data: existing, error: selectError } = await supabase
        .from("line_users")
        .select("message_count")
        .eq("line_user_id", userId)
        .maybeSingle();
      if (selectError) {
        console.error("[line_users] select failed", userId, selectError);
      }

      update.last_message = message.text;
      update.message_count = (existing?.message_count ?? 0) + 1;
      if (message.parsed.ward) update.ward = message.parsed.ward;
      if (message.parsed.numChildren !== null)
        update.num_children = message.parsed.numChildren;
      if (message.parsed.incomeManYen !== null)
        update.income_man_yen = message.parsed.incomeManYen;
    }

    const { error } = await supabase
      .from("line_users")
      .upsert(update, { onConflict: "line_user_id" });
    if (error) console.error("[line_users] upsert failed", userId, error);
  } catch (err) {
    console.error("[line_users] unexpected error", userId, err);
  }
}

async function logLineMessage(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  text: string,
  parsed: ReturnType<typeof parseMessage>
) {
  try {
    const { error } = await supabase.from("line_messages").insert({
      line_user_id: userId,
      text,
      ward: parsed.ward,
      num_children: parsed.numChildren,
      income_man_yen: parsed.incomeManYen,
    });
    if (error) console.error("[line_messages] insert failed", userId, error);
  } catch (err) {
    console.error("[line_messages] unexpected error", userId, err);
  }
}

function formatDiagnosisReply(text: string): string {
  const input = parseMessage(text);
  const result = diagnose(input);

  if (result.missingInfo.length > 0) {
    return `ごめん、もう少し情報が欲しいな。足りないのは「${result.missingInfo.join("、")}」だよ。\n\n例: 台東区 子供2人 年収300万\nみたいな形で送ってみてね。`;
  }

  const lines = result.items.map((item) => {
    const amount = item.monthlyYen ? `(月${item.monthlyYen.toLocaleString()}円)` : "";
    const windowLine = item.window ? `\n  申請窓口: ${item.window}` : "";
    const linkLine = item.programId
      ? `\n  詳細: https://hahanavi.vercel.app/seido/${item.programId}`
      : "";
    return `・${item.name}: ${item.status}${amount}\n  ${item.note}${windowLine}${linkLine}`;
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
        const supabase = getSupabaseServerClient();
        const logFollow = (async () => {
          try {
            const { error } = await supabase.from("line_follows").insert({});
            if (error) console.error("[line_follows] insert failed", error);
          } catch (err) {
            console.error("[line_follows] unexpected error", err);
          }
        })();
        const tasks = [
          replyToLine(event.replyToken, WELCOME_MESSAGE, channelAccessToken),
          logFollow,
        ];
        if (event.source?.userId) {
          tasks.push(touchLineUser(supabase, event.source.userId));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text ?? "";
        const reply = formatDiagnosisReply(text);
        const tasks = [replyToLine(event.replyToken, reply, channelAccessToken)];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          const parsed = parseMessage(text);
          tasks.push(
            touchLineUser(supabase, event.source.userId, { text, parsed }),
            logLineMessage(supabase, event.source.userId, text, parsed)
          );
        }
        await Promise.all(tasks);
      }
    })
  );

  return NextResponse.json({ ok: true });
}
