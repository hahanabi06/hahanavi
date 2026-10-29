import { NextRequest, NextResponse } from "next/server";
import { verifyLineSignature, replyToLine, WELCOME_MESSAGE, type QuickReplyItem } from "@/lib/line";
import { parseMessage, diagnose, type ParsedInput } from "@/lib/diagnosis";
import { getSupabaseServerClient } from "@/lib/supabase";
import programsData from "@/data/programs.json";
import {
  REGIONS,
  WARD_PAGES,
  CHILD_COUNT_OPTIONS,
  AGE_BRACKET_OPTIONS,
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

// ボタンでの診断フロー(state=line_usersのmode列、DiagFlowStateをJSON化したもの)の質問文とボタン生成。
// 「戻る」を正しい行き先に出せるよう、現在のstate(region/prefecture/wardの引き継ぎ内容)を見て組み立てる
const BACK_BUTTON_LABEL = "戻る";

function regionQuickReply(): QuickReplyItem[] {
  return REGIONS.map((r) => ({ label: r.name, data: `diag_region=${r.name}` }));
}
function prefectureQuickReply(region: string): QuickReplyItem[] {
  const found = REGIONS.find((r) => r.name === region);
  return (found?.prefectures ?? []).map((p) => ({ label: p, data: `diag_prefecture=${p}` }));
}
function wardQuickReply(page: number): QuickReplyItem[] {
  const wards = WARD_PAGES[page] ?? [];
  const items = wards.map((w) => ({ label: w, data: `diag_ward=${w}` }));
  if (page + 1 < WARD_PAGES.length) {
    items.push({ label: "次の区を見る", data: `diag_ward_page=${page + 1}` });
  }
  return items;
}
function childrenQuickReply(): QuickReplyItem[] {
  return CHILD_COUNT_OPTIONS.map((c) => ({ label: c.label, data: `diag_children=${c.value}` }));
}
function ageQuickReply(): QuickReplyItem[] {
  return AGE_BRACKET_OPTIONS.map((a) => ({ label: a.label, data: `diag_age=${a.value}` }));
}
function incomeQuickReply(): QuickReplyItem[] {
  return INCOME_BRACKET_OPTIONS.map((i) => ({ label: i.label, data: `diag_income=${i.value}` }));
}

// state.stepだけを見て、その質問文とボタン一覧を組み立てる。
// 「戻る」から呼ばれたときも、このまま同じUIを再現できるようにする
function promptForStep(state: DiagFlowState): { text: string; items: QuickReplyItem[] } {
  switch (state.step) {
    case "region":
      return {
        text: "お住まいの地方を選んでね",
        items: regionQuickReply(),
      };
    case "prefecture":
      return {
        text: `${state.region}のどこ?`,
        items: [
          ...prefectureQuickReply(state.region!),
          { label: BACK_BUTTON_LABEL, data: "diag_back=region" },
        ],
      };
    case "ward":
      return {
        text: "どの区?",
        items: [...wardQuickReply(0), { label: BACK_BUTTON_LABEL, data: "diag_back=prefecture" }],
      };
    case "children":
      return {
        text: "お子さんは何人?",
        items: [
          ...childrenQuickReply(),
          { label: BACK_BUTTON_LABEL, data: state.ward ? "diag_back=ward" : "diag_back=prefecture" },
        ],
      };
    case "childAge": {
      const askedSoFar = state.childAges?.length ?? 0;
      const total = state.numChildren ?? 1;
      const childNumber = askedSoFar + 1;
      return {
        text: total > 1 ? `${childNumber}人目のお子さんの年齢は?` : "お子さんの年齢は?",
        items: [...ageQuickReply(), { label: BACK_BUTTON_LABEL, data: "diag_back=childAge" }],
      };
    }
    case "income":
      return {
        text: "年収(世帯の合計)はどれくらい?",
        items: [...incomeQuickReply(), { label: BACK_BUTTON_LABEL, data: "diag_back=childAge" }],
      };
  }
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

// 「申請制度リマインダー」用: 前回の診断で保存されたプロフィール(ward/人数/年収)を読む。
// prefectureや子の年齢は保存していないので、ward(東京都の区)がある場合のみ再診断できる
async function getLineUserProfile(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string
): Promise<{ ward: string | null; numChildren: number | null; incomeManYen: number | null } | null> {
  try {
    const { data, error } = await supabase
      .from("line_users")
      .select("ward, num_children, income_man_yen")
      .eq("line_user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[line_users] profile select failed", userId, error);
      return null;
    }
    if (!data) return null;
    return {
      ward: data.ward ?? null,
      numChildren: data.num_children ?? null,
      incomeManYen: data.income_man_yen ?? null,
    };
  } catch (err) {
    console.error("[line_users] profile select unexpected error", userId, err);
    return null;
  }
}

// 「申請制度更新リマインダー」で、診断履歴が無い人にも見せる代表的な国の制度(登録してもらう候補)
const FALLBACK_REGISTER_PROGRAM_IDS = [
  "jidou-fuyou-teate",
  "jidou-teate",
  "maruoya-iryouhi",
  "koutou-shokugyou-kunren",
  "jiritsu-shien-kyouiku-kunren",
  "hitorioya-koujo",
];

function programNameById(programId: string): string | null {
  return programsData.programs.find((p) => p.id === programId)?.name ?? null;
}

async function saveRegisteredProgram(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  programId: string,
  programName: string
): Promise<void> {
  try {
    const { error } = await supabase.from("line_program_registrations").insert({
      line_user_id: userId,
      program_id: programId,
      program_name: programName,
    });
    if (error) console.error("[line_program_registrations] insert failed", userId, error);
  } catch (err) {
    console.error("[line_program_registrations] unexpected error", userId, err);
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

function itemLine(item: ReturnType<typeof diagnose>["items"][number]): string {
  const amount = item.monthlyYen
    ? `: 月${item.monthlyYen.toLocaleString()}円`
    : item.monthlyYenRange
      ? `: 月${item.monthlyYenRange.min.toLocaleString()}円〜${item.monthlyYenRange.max.toLocaleString()}円`
      : item.yearlyYen
        ? `: 年${item.yearlyYen.toLocaleString()}円くらい`
        : "";
  const linkLine = item.programId
    ? `\n  詳細: https://hahanavi.vercel.app/seido/${item.programId}`
    : "";
  return `・${item.name}${amount}\n  ${item.note}${linkLine}`;
}

// 「こんな制度もあるよ」(要確認)は説明文なしで名前+リンクだけにして情報量を抑える
function infoItemLine(item: ReturnType<typeof diagnose>["items"][number]): string {
  const linkLine = item.programId
    ? `\n  詳細: https://hahanavi.vercel.app/seido/${item.programId}`
    : "";
  return `・${item.name}${linkLine}`;
}

function formatDiagnosisReply(input: ParsedInput): string {
  const result = diagnose(input);

  if (result.missingInfo.length > 0) {
    return `ごめん、もう少し情報が欲しいな。足りないのは「${result.missingInfo.join("、")}」だよ。\n\n例: 台東区 子供2人 年収300万\nみたいな形で送ってみてね。`;
  }

  const eligible = result.items.filter((i) => i.status === "全部支給" || i.status === "一部支給");
  const info = result.items.filter((i) => i.status === "要確認");
  const ineligible = result.items.filter((i) => i.status === "対象外");

  // 見出し: もらえそうな給付額のレンジと、費用軽減系の制度があるかどうか
  let minTotal = 0;
  let maxTotal = 0;
  const cashItemNames: string[] = [];
  for (const item of eligible) {
    if (item.monthlyYen) {
      minTotal += item.monthlyYen;
      maxTotal += item.monthlyYen;
      cashItemNames.push(item.name);
    } else if (item.monthlyYenRange) {
      minTotal += item.monthlyYenRange.min;
      maxTotal += item.monthlyYenRange.max;
      cashItemNames.push(item.name);
    }
  }
  const medicalItem = eligible.find((i) => i.reductionKind === "medical");
  const insuranceItem = eligible.find((i) => i.reductionKind === "insurance");
  const pensionItem = eligible.find((i) => i.reductionKind === "pension");

  const headlineLines: string[] = [];
  if (maxTotal > 0) {
    const breakdown = cashItemNames.length > 0 ? `(${cashItemNames.join("・")})` : "";
    headlineLines.push(
      minTotal === maxTotal
        ? `💰 月${minTotal.toLocaleString()}円くらいの給付が受けられそうだよ${breakdown}`
        : `💰 月${minTotal.toLocaleString()}円〜${maxTotal.toLocaleString()}円くらいの給付が受けられそうだよ${breakdown}`
    );
  }
  if (medicalItem) {
    headlineLines.push("🏥 医療費の自己負担もほぼ無料になりそう");
  }
  if (insuranceItem?.yearlyYen) {
    headlineLines.push(`🧾 国保の保険料も年${insuranceItem.yearlyYen.toLocaleString()}円くらい軽くなりそう(全国平均ベースの目安)`);
  }
  if (pensionItem?.yearlyYen) {
    headlineLines.push(`📋 国民年金保険料が年${pensionItem.yearlyYen.toLocaleString()}円くらい免除されそう`);
  }
  const headline = headlineLines.length > 0 ? headlineLines.join("\n") + "\n\n" : "";

  // 対象となりそうな制度を、窓口ごとに束ねて表示
  const sections: string[] = [];
  if (eligible.length > 0) {
    const officeGroups = new Map<string, typeof eligible>();
    for (const item of eligible) {
      const key = item.office ?? "その他";
      if (!officeGroups.has(key)) officeGroups.set(key, []);
      officeGroups.get(key)!.push(item);
    }
    const groupBlocks = Array.from(officeGroups.entries()).map(
      ([office, items]) => `▶ 申請窓口: ${office}\n\n${items.map(itemLine).join("\n\n")}`
    );
    sections.push(`【対象となりそうな制度】(申請窓口ごとに整理したよ)\n\n${groupBlocks.join("\n\n")}`);
  }

  if (info.length > 0) {
    sections.push(`【こんな制度もあるよ】\n\n${info.map(infoItemLine).join("\n")}`);
  }

  if (ineligible.length > 0) {
    sections.push(`【今回は対象外かもしれない制度】\n\n${ineligible.map((i) => `・${i.name}\n  ${i.note}`).join("\n\n")}`);
  }

  return `診断したよ!\n(これは概算の金額だよ!正確な判定は窓口で確認してね)\n\n${headline}${sections.join("\n\n")}\n\nこれは年収ベースの概算だよ。正式な判定は窓口で確認してね。`;
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
        const { text, items } = promptForStep({ step: "region" });
        const tasks = [replyToLine(event.replyToken, text, channelAccessToken, items)];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(setLineUserMode(supabase, event.source.userId, encodeState({ step: "region" })));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data === "action=register_program") {
        const userId = event.source?.userId;
        if (!userId) return;
        const supabase = getSupabaseServerClient();
        const profile = userId ? await getLineUserProfile(supabase, userId) : null;

        // 前回の診断情報があれば、実際に対象になりそうだった制度を候補にする。無ければ代表的な国の制度を出す
        let candidates: { id: string; name: string }[];
        if (profile?.ward && profile.numChildren !== null && profile.incomeManYen !== null) {
          const result = diagnose({
            ward: profile.ward,
            prefecture: "東京都",
            isTokyo: true,
            numChildren: profile.numChildren,
            incomeManYen: profile.incomeManYen,
            childAges: null,
          });
          candidates = result.items
            .filter((i) => (i.status === "全部支給" || i.status === "一部支給") && i.programId)
            .map((i) => ({ id: i.programId!, name: i.name }));
        } else {
          candidates = FALLBACK_REGISTER_PROGRAM_IDS.map((id) => ({
            id,
            name: programNameById(id) ?? id,
          }));
        }

        const items: QuickReplyItem[] = candidates
          .slice(0, 13)
          .map((c) => ({ label: c.name, data: `register_program=${c.id}` }));
        const reply =
          "申請した制度を登録しておくと、更新が必要なタイミングでお知らせできるように準備していくね。どの制度を申請した?";
        await replyToLine(event.replyToken, reply, channelAccessToken, items);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("register_program=")) {
        const programId = event.postback.data.slice("register_program=".length);
        const userId = event.source?.userId;
        if (!userId) return;
        const name = programNameById(programId) ?? programId;
        const supabase = getSupabaseServerClient();
        await Promise.all([
          saveRegisteredProgram(supabase, userId, programId, name),
          replyToLine(
            event.replyToken,
            `「${name}」を登録したよ!更新が必要なタイミングでお知らせできるように準備してるから、楽しみにしてて。`,
            channelAccessToken
          ),
        ]);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_back=")) {
        const targetStep = event.postback.data.slice("diag_back=".length) as DiagFlowState["step"];
        const userId = event.source?.userId;
        if (!userId) return;
        const supabase = getSupabaseServerClient();
        const current = decodeState(await getLineUserMode(supabase, userId));
        if (!current) return; // 状態が無い(タイムアウト等)場合は何もしない

        // 年齢質問への「戻る」は人数分ループする特殊ステップなので、配列から1件戻す形にする。
        // すでに1人目を聞いている途中(配列が空)なら、人数選択まで戻す
        let targetState: DiagFlowState;
        if (targetStep === "childAge") {
          const ages = [...(current.childAges ?? [])];
          if (ages.length === 0) {
            targetState = { ...current, step: "children", childAges: undefined };
          } else {
            ages.pop();
            targetState = { ...current, step: "childAge", childAges: ages };
          }
        } else {
          targetState = { ...current, step: targetStep };
        }

        const { text, items } = promptForStep(targetState);
        await Promise.all([
          replyToLine(event.replyToken, text, channelAccessToken, items),
          setLineUserMode(supabase, userId, encodeState(targetState)),
        ]);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_region=")) {
        const region = event.postback.data.slice("diag_region=".length);
        const nextState: DiagFlowState = { step: "prefecture", region };
        const { text, items } = promptForStep(nextState);
        const tasks = [replyToLine(event.replyToken, text, channelAccessToken, items)];
        if (event.source?.userId) {
          const supabase = getSupabaseServerClient();
          tasks.push(setLineUserMode(supabase, event.source.userId, encodeState(nextState)));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_prefecture=")) {
        const prefecture = event.postback.data.slice("diag_prefecture=".length);
        const userId = event.source?.userId;
        const supabase = userId ? getSupabaseServerClient() : null;
        const current = supabase && userId ? decodeState(await getLineUserMode(supabase, userId)) : null;
        const region = current?.region;

        const nextState: DiagFlowState =
          prefecture === "東京都"
            ? { step: "ward", region, prefecture }
            : { step: "children", region, prefecture };
        const { text, items } = promptForStep(nextState);
        const tasks = [replyToLine(event.replyToken, text, channelAccessToken, items)];
        if (supabase && userId) {
          tasks.push(setLineUserMode(supabase, userId, encodeState(nextState)));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_ward_page=")) {
        const page = parseInt(event.postback.data.slice("diag_ward_page=".length), 10);
        const items = [
          ...wardQuickReply(page),
          { label: BACK_BUTTON_LABEL, data: "diag_back=prefecture" },
        ];
        await replyToLine(event.replyToken, "どの区?", channelAccessToken, items);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_ward=")) {
        const ward = event.postback.data.slice("diag_ward=".length);
        const userId = event.source?.userId;
        const supabase = userId ? getSupabaseServerClient() : null;
        const current = supabase && userId ? decodeState(await getLineUserMode(supabase, userId)) : null;

        const nextState: DiagFlowState = {
          step: "children",
          region: current?.region,
          prefecture: "東京都",
          ward,
        };
        const { text, items } = promptForStep(nextState);
        const tasks = [replyToLine(event.replyToken, text, channelAccessToken, items)];
        if (supabase && userId) {
          tasks.push(setLineUserMode(supabase, userId, encodeState(nextState)));
        }
        await Promise.all(tasks);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_children=")) {
        const numChildren = parseInt(event.postback.data.slice("diag_children=".length), 10);
        const userId = event.source?.userId;
        if (!userId) return;
        const supabase = getSupabaseServerClient();
        const current = decodeState(await getLineUserMode(supabase, userId));
        if (!current?.prefecture) return; // 想定外の状態からの遷移は無視

        // 人数を選んだら、1人ずつ年齢を聞くループを開始する(やり直しも想定してchildAgesはリセット)
        const nextState: DiagFlowState = { ...current, step: "childAge", numChildren, childAges: [] };
        const { text, items } = promptForStep(nextState);
        await Promise.all([
          replyToLine(event.replyToken, text, channelAccessToken, items),
          setLineUserMode(supabase, userId, encodeState(nextState)),
        ]);
        return;
      }

      if (event.type === "postback" && event.postback?.data?.startsWith("diag_age=")) {
        const age = parseInt(event.postback.data.slice("diag_age=".length), 10);
        const userId = event.source?.userId;
        if (!userId) return;
        const supabase = getSupabaseServerClient();
        const current = decodeState(await getLineUserMode(supabase, userId));
        if (!current || current.step !== "childAge" || current.numChildren === undefined) {
          return; // 想定外の状態からの遷移は無視
        }

        const childAges = [...(current.childAges ?? []), age];
        const nextState: DiagFlowState =
          childAges.length < current.numChildren
            ? { ...current, childAges } // まだ聞いていない子がいるので、同じステップで次の子を聞く
            : { ...current, step: "income", childAges };
        const { text, items } = promptForStep(nextState);
        await Promise.all([
          replyToLine(event.replyToken, text, channelAccessToken, items),
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
        if (!state || state.step !== "income" || !state.prefecture || state.numChildren === undefined) {
          return; // 想定外の状態からの遷移は無視
        }

        const parsed: ParsedInput = {
          ward: state.ward ?? null,
          prefecture: state.prefecture,
          isTokyo: state.prefecture === "東京都",
          numChildren: state.numChildren,
          incomeManYen,
          childAges: state.childAges ?? null,
        };
        const reply = formatDiagnosisReply(parsed);
        await Promise.all([
          replyToLine(event.replyToken, reply, channelAccessToken),
          setLineUserMode(supabase, userId, null),
          touchLineUser(supabase, userId, {
            text: `[ボタン診断] ${state.prefecture}${state.ward ? " " + state.ward : ""} 子供${state.numChildren}人(年齢${state.childAges?.join("/") ?? "不明"}) 年収${incomeManYen}万`,
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
