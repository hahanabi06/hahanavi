import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature, replyToLine, WELCOME_MESSAGE, type QuickReplyItem } from "@/lib/line";
import { parseMessage, diagnose, type ParsedInput } from "@/lib/diagnosis";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  REGIONS,
  WARD_AREAS,
  CHILD_COUNT_OPTIONS,
  INCOME_BRACKET_OPTIONS,
  encodeState,
  decodeState,
  type DiagFlowState,
} from "@/lib/diagnosis-flow";

type LineEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
  postback?: { data: string };
  source?: { type: string; userId?: string };
};

const FEEDBACK_PROMPT =
  "どんな悩みか教えてね。制度のことでも、記事のリクエストでも、サイトへの要望でも、どんなことでも大丈夫だよ。\n\n(この後に送ってもらった内容を、そのままご意見として記録するね)";
const FEEDBACK_THANKS = "送ってくれてありがとう!参考にさせてもらうね。\n\nまた制度を診断したいときは、下のメニューの「支援制度診断」からもう一度試してね。";

// ボタンでの診断フロー(state=line_usersのmode列、DiagFlowStateをJSON化したもの)の質問文とボタン生成
function regionQuickReply(): QuickReplyItem[] {
  return REGIONS.map((r) => ({ label: r.name, data: `diag_region=${r.name}` }));
}
function prefectureQuickReply(region: string): QuickReplyItem[] {
  const found = REGIONS.find((r) => r.name === region);
  return (found?.prefectures ?? []).map((p) => ({ label: p, data: `diag_prefecture=${p}` }));
}
function wardAreaQuickReply(): QuickReplyItem[] {
  return WARD_AREAS.map((a) => ({ label: a.name, data: `diag_ward_area=${a.name}` }));
}
function wardQuickReply(areaName: string): QuickReplyItem[] {
  const found = WARD_AREAS.find((a) => a.name === areaName);
  return (found?.wards ?? []).map((w) => ({ label: w, data: `diag_ward=${w}` }));
}
function childrenQuickReply(): QuickReplyItem[] {
  return CHILD_COUNT_OPTIONS.map((c) => ({ label: c.label, data: `diag_children=${c.value}` }));
}
function incomeQuickReply(): QuickReplyItem[] {
  return INCOME_BRACKET_OPTIONS.map((i) => ({ label: i.label, data: `diag_income=${i.value}` }));
}

async function getLineUserMode(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("line_users")
      .select("mode")
      .eq("line_user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[line_users] mode select failed", userId, error);
      return null;
    }
    return data?.mode ?? null;
  } catch (err) {
    console.error("[line_users] mode select unexpected error", userId, err);
    return null;
  }
}

async function setLineUserMode(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  mode: string | null
): Promise<void> {
  try {
    const { error } = await supabase
      .from("line_users")
      .upsert({ line_user_id: userId, mode }, { onConflict: "line_user_id" });
    if (error) console.error("[line_users] mode upsert failed", userId, error);
  } catch (err) {
    console.error("[line_users] mode upsert unexpected error", userId, err);
  }
}

async function saveFeedback(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  message: string
): Promise<void> {
  try {
    const { error } = await supabase.from("program_reports").insert({
      program_id: null,
      program_name: null,
      message: `【LINEご意見箱 / ${userId}】\n${message}`,
      source: "line_feedback",
    });
    if (error) console.error("[program_reports] line feedback insert failed", userId, error);
  } catch (err) {
    console.error("[program_reports] line feedback unexpected error", userId, err);
  }
}

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

function formatDiagnosisReply(input: ParsedInput): string {
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

      if (event.type === "postback" && event.postback?.data === "action=feedback") {
        const tasks = [replyToLine(event.replyToken, FEEDBACK_PROMPT, channelAccessToken)];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(setLineUserMode(supabase, event.source.userId, "feedback_wait"));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data === "action=diagnose") {
        const tasks = [
          replyToLine(
            event.replyToken,
            "お住まいの地方を選んでね(ボタンで答えられない場合は「台東区 子供2人 年収300万」みたいに打ってもOK)",
            channelAccessToken,
            regionQuickReply()
          ),
        ];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(setLineUserMode(supabase, event.source.userId, encodeState({ step: "region" })));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_region=")) {
        const region = event.postback.data.slice("diag_region=".length);
        const tasks = [
          replyToLine(
            event.replyToken,
            `${region}のどこ?`,
            channelAccessToken,
            prefectureQuickReply(region)
          ),
        ];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(
            setLineUserMode(supabase, event.source.userId, encodeState({ step: "prefecture", region }))
          );
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_prefecture=")) {
        const prefecture = event.postback.data.slice("diag_prefecture=".length);
        if (prefecture === "東京都") {
          const tasks = [
            replyToLine(event.replyToken, "どのエリア?", channelAccessToken, wardAreaQuickReply()),
          ];
          if (event.source?.userId) {
            const supabase = getSupabaseServerClient();
            tasks.push(
              setLineUserMode(
                supabase,
                event.source.userId,
                encodeState({ step: "ward_area", prefecture })
              )
            );
          }
          await Promise.all(tasks);
          return;
        }
        const tasks = [
          replyToLine(event.replyToken, "お子さんは何人?", channelAccessToken, childrenQuickReply()),
        ];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(
            setLineUserMode(supabase, event.source.userId, encodeState({ step: "children", prefecture }))
          );
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_ward_area=")) {
        const wardArea = event.postback.data.slice("diag_ward_area=".length);
        const tasks = [
          replyToLine(event.replyToken, "どの区?", channelAccessToken, wardQuickReply(wardArea)),
        ];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(
            setLineUserMode(
              supabase,
              event.source.userId,
              encodeState({ step: "ward", prefecture: "東京都", wardArea })
            )
          );
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_ward=")) {
        const ward = event.postback.data.slice("diag_ward=".length);
        const tasks = [
          replyToLine(event.replyToken, "お子さんは何人?", channelAccessToken, childrenQuickReply()),
        ];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(
            setLineUserMode(
              supabase,
              event.source.userId,
              encodeState({ step: "children", prefecture: "東京都", ward })
            )
          );
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_children=")) {
        const numChildren = parseInt(event.postback.data.slice("diag_children=".length), 10);
        const userId = event.source?.userId;
        if (!userId) return;
        const supabase = getSupabaseServerClient();
        const currentMode = await getLineUserMode(supabase, userId);
        const state = decodeState(currentMode);
        const prefecture = state && "prefecture" in state ? state.prefecture : null;
        const ward = state && "ward" in state ? state.ward : undefined;
        if (!prefecture) return; // 想定外の状態からの遷移は無視

        const nextState: DiagFlowState = { step: "income", prefecture, ward, numChildren };
        await Promise.all([
          replyToLine(event.replyToken, "年収(世帯の合計)はどれくらい?", channelAccessToken, incomeQuickReply()),
          setLineUserMode(supabase, userId, encodeState(nextState)),
        ]);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_income=")) {
        const incomeManYen = parseInt(event.postback.data.slice("diag_income=".length), 10);
        const userId = event.source?.userId;
        if (!userId) return;
        const supabase = getSupabaseServerClient();
        const currentMode = await getLineUserMode(supabase, userId);
        const state = decodeState(currentMode);
        if (!state || state.step !== "income") return; // 想定外の状態からの遷移は無視

        const parsed: ParsedInput = {
          ward: state.ward ?? null,
          prefecture: state.prefecture,
          isTokyo: state.prefecture === "東京都",
          numChildren: state.numChildren,
          incomeManYen,
        };
        const reply = formatDiagnosisReply(parsed);
        await Promise.all([
          replyToLine(event.replyToken, reply, channelAccessToken),
          setLineUserMode(supabase, userId, null),
          touchLineUser(supabase, userId, {
            text: `[ボタン診断] ${state.prefecture}${state.ward ? " " + state.ward : ""} 子供${state.numChildren}人 年収${incomeManYen}万`,
            parsed,
          }),
        ]);
        return;
      }

      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text ?? "";
        const userId = event.source?.userId;
        const supabase = userId ? getSupabaseServerClient() : null;

        const mode = supabase && userId ? await getLineUserMode(supabase, userId) : null;

        if (mode === "feedback_wait") {
          const tasks = [replyToLine(event.replyToken, FEEDBACK_THANKS, channelAccessToken)];
          if (supabase && userId) {
            tasks.push(
              saveFeedback(supabase, userId, text),
              setLineUserMode(supabase, userId, null),
              touchLineUser(supabase, userId, { text, parsed: parseMessage(text) })
            );
          }
          await Promise.all(tasks);
          return;
        }

        const parsed = parseMessage(text);
        const reply = formatDiagnosisReply(parsed);
        const tasks = [replyToLine(event.replyToken, reply, channelAccessToken)];
        if (supabase && userId) {
          tasks.push(
            touchLineUser(supabase, userId, { text, parsed }),
            logLineMessage(supabase, userId, text, parsed)
          );
          // ボタン診断フローの途中で自由入力された場合、古いフロー状態が残らないようクリアする
          if (mode) tasks.push(setLineUserMode(supabase, userId, null));
        }
        await Promise.all(tasks);
      }
    })
  );

  return NextResponse.json({ ok: true });
}
