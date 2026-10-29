import programsData from "@/data/programs.json";
import { PREFECTURES } from "@/lib/constants";

export const TOKYO_WARDS = [
  "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区",
  "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区",
  "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区",
  "葛飾区", "江戸川区",
];

export type ParsedInput = {
  ward: string | null;
  prefecture: string | null;
  isTokyo: boolean;
  numChildren: number | null;
  incomeManYen: number | null;
};

export function parseMessage(text: string): ParsedInput {
  const ward = TOKYO_WARDS.find((w) => text.includes(w)) ?? null;
  const prefecture = PREFECTURES.find((p) => text.includes(p)) ?? (ward ? "東京都" : null);
  const isTokyo = ward !== null || prefecture === "東京都" || /東京/.test(text);

  const childMatch = text.match(/子(?:供|ども)?\s*(\d+)\s*人/);
  const numChildren = childMatch ? parseInt(childMatch[1], 10) : null;

  const incomeMatch =
    text.match(/(?:年収|収入)\s*(\d+(?:\.\d+)?)\s*万/) ??
    text.match(/(\d+(?:\.\d+)?)\s*万円?/);
  const incomeManYen = incomeMatch ? parseFloat(incomeMatch[1]) : null;

  return { ward, prefecture, isTokyo, numChildren, incomeManYen };
}

export type BenefitResult = {
  name: string;
  status: "全部支給" | "一部支給" | "対象外" | "要確認";
  note: string; // kumaNoteがあればそれ、無ければ簡潔な説明
  monthlyYen?: number; // 全部支給の確定額
  monthlyYenRange?: { min: number; max: number }; // 一部支給の概算レンジ
  isReduction?: boolean; // 現金給付じゃなく「費用が軽くなる」系の制度か
  office?: string; // 対象となりそうな制度を窓口ごとに束ねるための簡易カテゴリ
  window?: string;
  programId?: string;
};

export type DiagnosisResult = {
  items: BenefitResult[];
  totalMonthlyYen: number;
  missingInfo: string[];
};

// programs.jsonのdiagnosisRuleフィールド(income/children/wardベースで機械的に判定できる制度のみ持つ)の型。
// サイト表示用の金額・所得制限の文章と、ここで使う数字がズレないよう、programs.json側を単一の情報源にする
// (以前: diagnosis.tsに独自の定数テーブルを持っていて、programs.json側の修正が反映されず数字がズレる事故があった)
type IncomeAmountTable = {
  limitByChildren: number[];
  extraLimitPerChild: number;
  amountByChildren?: number[];
  extraAmountPerChild?: number;
  amountPerChild?: number;
};

type DiagnosisRule = {
  scope: "national" | "tokyo" | "tokyo_ward";
  fullSupport: IncomeAmountTable;
  partialSupport?: {
    limitByChildren: number[];
    extraLimitPerChild: number;
    amountRangeBase: { min: number; max: number };
    extraAmountRangePerChild: { min: number; max: number };
  };
  wardOverride?: {
    wards: string[];
    limitByChildren: number[];
    extraLimitPerChild: number;
  };
};

type ProgramWithRule = {
  id: string;
  name: string;
  window: string;
  kumaNote?: string;
  diagnosisRule?: DiagnosisRule;
};

type PrefectureProgram = {
  id: string;
  name: string;
  headline?: string;
  layer: string;
  prefecture?: string;
};

const programs = programsData.programs as unknown as (ProgramWithRule & PrefectureProgram)[];

function limitForCount(table: number[], extraPerChild: number, count: number): number {
  const idx = Math.min(count, table.length - 1);
  const base = table[idx];
  const extra = Math.max(0, count - (table.length - 1));
  return base + extra * extraPerChild;
}

function amountForCount(table: IncomeAmountTable, count: number): number {
  if (table.amountPerChild !== undefined) {
    return table.amountPerChild * count;
  }
  const byChildren = table.amountByChildren ?? [];
  const extra = table.extraAmountPerChild ?? 0;
  const idx = Math.min(count, byChildren.length - 1);
  const base = byChildren[idx] ?? 0;
  const over = Math.max(0, count - (byChildren.length - 1));
  return base + over * extra;
}

function diagnoseRuleBasedProgram(
  program: ProgramWithRule,
  count: number,
  income: number,
  office: string,
  extraNote: string
): BenefitResult {
  const rule = program.diagnosisRule!;
  const fullLimit = limitForCount(
    rule.fullSupport.limitByChildren,
    rule.fullSupport.extraLimitPerChild,
    count
  );

  if (income < fullLimit) {
    const amount = amountForCount(rule.fullSupport, count);
    return {
      name: program.name,
      status: "全部支給",
      note: program.kumaNote ?? `全部支給の対象になりそうです${extraNote}`,
      monthlyYen: amount > 0 ? amount : undefined,
      office,
      window: program.window,
      programId: program.id,
    };
  }

  // 一部支給の枠もある場合は、そちらのしきい値まで判定する。無い場合もfullLimitを
  // 「本当は対象になる基準」として対象外メッセージに使う
  const effectiveLimit = rule.partialSupport
    ? limitForCount(
        rule.partialSupport.limitByChildren,
        rule.partialSupport.extraLimitPerChild,
        count
      )
    : fullLimit;

  if (rule.partialSupport && income < effectiveLimit) {
    const extra = Math.max(0, count - 1);
    const minAmount =
      rule.partialSupport.amountRangeBase.min +
      extra * rule.partialSupport.extraAmountRangePerChild.min;
    const maxAmount =
      rule.partialSupport.amountRangeBase.max +
      extra * rule.partialSupport.extraAmountRangePerChild.max;
    return {
      name: program.name,
      status: "一部支給",
      note: program.kumaNote ?? `一部支給の対象になりそうです${extraNote}`,
      monthlyYenRange: { min: minAmount, max: maxAmount },
      office,
      window: program.window,
      programId: program.id,
    };
  }

  return {
    name: program.name,
    status: "対象外",
    note: `年収${effectiveLimit.toLocaleString()}万円未満の方が対象だけど、今回の年収(${income.toLocaleString()}万円)だと基準を超えてるみたい`,
    programId: program.id,
  };
}

export function diagnose(input: ParsedInput): DiagnosisResult {
  const items: BenefitResult[] = [];
  const missingInfo: string[] = [];
  let totalMonthlyYen = 0;

  if (input.numChildren === null) missingInfo.push("子どもの人数");
  if (input.incomeManYen === null) missingInfo.push("年収(万円)");

  if (missingInfo.length > 0) {
    return { items, totalMonthlyYen: 0, missingInfo };
  }

  const count = input.numChildren!;
  const income = input.incomeManYen!;
  const KOSODATE_OFFICE = "区市町村役場の子育て支援課";
  const IRYOHI_OFFICE = "区市町村役場の医療費助成担当";

  // 児童扶養手当(国の制度、全国どこでも対象)
  const fuyouProgram = programs.find((p) => p.id === "jidou-fuyou-teate")!;
  const fuyouResult = diagnoseRuleBasedProgram(fuyouProgram, count, income, KOSODATE_OFFICE, "");
  items.push(fuyouResult);
  if (fuyouResult.monthlyYen) totalMonthlyYen += fuyouResult.monthlyYen;

  // 一部支給の判定にも使うため、しきい値だけ再計算(資格取得支援の案内に流用)
  const partialLimit = fuyouProgram.diagnosisRule!.partialSupport
    ? limitForCount(
        fuyouProgram.diagnosisRule!.partialSupport!.limitByChildren,
        fuyouProgram.diagnosisRule!.partialSupport!.extraLimitPerChild,
        count
      )
    : limitForCount(
        fuyouProgram.diagnosisRule!.fullSupport.limitByChildren,
        fuyouProgram.diagnosisRule!.fullSupport.extraLimitPerChild,
        count
      );

  // 児童育成手当・マル親(東京都独自、都内在住なら対象)
  if (input.isTokyo) {
    const ikuseiProgram = programs.find((p) => p.id === "jidou-ikusei-teate")!;
    const ikuseiResult = diagnoseRuleBasedProgram(
      ikuseiProgram,
      count,
      income,
      KOSODATE_OFFICE,
      "(東京都在住なら区を問わず対象)"
    );
    items.push(ikuseiResult);
    if (ikuseiResult.monthlyYen) totalMonthlyYen += ikuseiResult.monthlyYen;

    // マル親医療費助成: 23区それぞれの所得基準で判定(ward指定のある区のみ基準が異なる)
    if (input.ward) {
      const maruoyaProgram = programs.find((p) => p.id === "maruoya-iryouhi")!;
      const rule = maruoyaProgram.diagnosisRule!;
      const useWardOverride = rule.wardOverride?.wards.includes(input.ward) ?? false;
      const table = useWardOverride ? rule.wardOverride! : rule.fullSupport;
      const limit = limitForCount(table.limitByChildren, table.extraLimitPerChild, count);

      if (income < limit) {
        items.push({
          name: maruoyaProgram.name,
          status: "全部支給",
          note: maruoyaProgram.kumaNote ?? "医療費の自己負担がほぼ無料になりそうです",
          isReduction: true,
          office: IRYOHI_OFFICE,
          window: maruoyaProgram.window,
          programId: maruoyaProgram.id,
        });
      } else {
        items.push({
          name: maruoyaProgram.name,
          status: "対象外",
          note: `年収${limit.toLocaleString()}万円未満の方が対象だけど、今回の年収(${income.toLocaleString()}万円)だと基準を超えてるみたい(${input.ward}の基準)`,
          programId: maruoyaProgram.id,
        });
      }
    } else {
      items.push({
        name: "ひとり親家庭等医療費助成(マル親)",
        status: "要確認",
        note: "医療費の自己負担が軽くなる制度です。区が分かるとここも診断できます",
      });
    }
  } else if (input.prefecture) {
    // 東京都以外: その県独自の上乗せ制度があれば案内のみ(所得条件が複雑/別の質問が必要なため自動判定はしない)
    const prefecturePrograms = programs.filter(
      (p) => p.layer === "prefecture" && p.prefecture === input.prefecture
    );
    if (prefecturePrograms.length > 0) {
      for (const p of prefecturePrograms) {
        items.push({
          name: p.name,
          status: "要確認",
          note: `${input.prefecture}独自の制度だよ。${p.headline ?? ""}。詳しい条件はリンクで確認してね`,
          programId: p.id,
        });
      }
    } else {
      items.push({
        name: "お住まいの地域の制度",
        status: "要確認",
        note: `${input.prefecture}独自の上乗せ制度は見つけられていません。国の制度(児童扶養手当)のみ診断しています`,
      });
    }
  } else {
    items.push({
      name: "お住まいの地域の制度",
      status: "要確認",
      note: "お住まいの都道府県が分かると、その地域独自の制度も案内できるよ",
    });
  }

  // 児童扶養手当の対象(全部・一部支給どちらか)なら、資格取得支援もセットで案内
  if (income < partialLimit) {
    const kunrenProgram = programs.find((p) => p.id === "koutou-shokugyou-kunren");
    items.push({
      name: "資格取得支援(高等職業訓練促進給付金 等)",
      status: "要確認",
      note:
        kunrenProgram?.kumaNote ??
        "看護師・介護福祉士などの資格取得を目指すなら、月7万円台〜14万円の生活費支援が受けられる可能性があります。資格に興味があれば詳細ページをチェックしてね",
      programId: "koutou-shokugyou-kunren",
    });
  }

  const koujoProgram = programs.find((p) => p.id === "hitorioya-koujo");
  items.push({
    name: "ひとり親控除(税制)",
    status: "要確認",
    note:
      koujoProgram?.kumaNote ??
      "所得税・住民税が35万円控除される制度です(本人所得500万円以下が条件)。確定申告か年末調整で忘れずに申請してね",
    programId: "hitorioya-koujo",
  });

  return { items, totalMonthlyYen, missingInfo };
}
