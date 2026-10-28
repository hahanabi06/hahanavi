const TOKYO_WARDS = [
  "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区",
  "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区",
  "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区",
  "葛飾区", "江戸川区",
];

export type ParsedInput = {
  ward: string | null;
  isTokyo: boolean;
  numChildren: number | null;
  incomeManYen: number | null;
};

export function parseMessage(text: string): ParsedInput {
  const ward = TOKYO_WARDS.find((w) => text.includes(w)) ?? null;
  const isTokyo = ward !== null || /東京/.test(text);

  const childMatch = text.match(/子(?:供|ども)?\s*(\d+)\s*人/);
  const numChildren = childMatch ? parseInt(childMatch[1], 10) : null;

  const incomeMatch =
    text.match(/(?:年収|収入)\s*(\d+(?:\.\d+)?)\s*万/) ??
    text.match(/(\d+(?:\.\d+)?)\s*万円?/);
  const incomeManYen = incomeMatch ? parseFloat(incomeMatch[1]) : null;

  return { ward, isTokyo, numChildren, incomeManYen };
}

type BenefitResult = {
  name: string;
  status: "全部支給" | "一部支給" | "対象外" | "要確認";
  note: string;
  monthlyYen?: number;
};

export type DiagnosisResult = {
  items: BenefitResult[];
  totalMonthlyYen: number;
  missingInfo: string[];
};

// 扶養人数(≒子の人数)ごとの所得制限額(万円)。3人を超える分は1人につき38万円加算。
const JIDO_FUYOU_FULL_LIMIT = [77, 115, 153];
const JIDO_FUYOU_PARTIAL_LIMIT = [216, 254, 292];
const JIDO_FUYOU_FULL_AMOUNT = [48050, 59400, 70750];
const JIDO_IKUSEI_LIMIT = [383.8, 421.8, 459.8, 497.8];

function limitForCount(table: number[], count: number): number {
  const idx = Math.min(count, table.length - 1);
  const base = table[idx];
  const extra = Math.max(0, count - (table.length - 1));
  return base + extra * 38;
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

  // 児童扶養手当(全国共通)
  const fuyoFullLimit = limitForCount(JIDO_FUYOU_FULL_LIMIT, count);
  const fuyoPartialLimit = limitForCount(JIDO_FUYOU_PARTIAL_LIMIT, count);
  if (income < fuyoFullLimit) {
    const amount =
      count === 0
        ? 0
        : JIDO_FUYOU_FULL_AMOUNT[Math.min(count, 3) - 1] +
          Math.max(0, count - 3) * 11350;
    items.push({
      name: "児童扶養手当(国)",
      status: "全部支給",
      note: "全部支給の対象になりそうです",
      monthlyYen: amount,
    });
    totalMonthlyYen += amount;
  } else if (income < fuyoPartialLimit) {
    items.push({
      name: "児童扶養手当(国)",
      status: "一部支給",
      note: "一部支給の対象になりそうですが、具体的な金額は所得で変わるため窓口でご確認ください",
    });
  } else {
    items.push({
      name: "児童扶養手当(国)",
      status: "対象外",
      note: "所得基準を超えているため対象外の可能性が高いです",
    });
  }

  // 児童育成手当(東京都、都内在住のみ)
  if (input.isTokyo) {
    const ikuseiLimit = limitForCount(JIDO_IKUSEI_LIMIT, count);
    if (income < ikuseiLimit) {
      const amount = 13500 * count;
      items.push({
        name: "児童育成手当(東京都)",
        status: "全部支給",
        note: "東京都在住なら区を問わず対象になりそうです",
        monthlyYen: amount,
      });
      totalMonthlyYen += amount;
    } else {
      items.push({
        name: "児童育成手当(東京都)",
        status: "対象外",
        note: "所得基準を超えているため対象外の可能性が高いです",
      });
    }

    items.push({
      name: "ひとり親家庭等医療費助成(マル親)",
      status: "要確認",
      note: "医療費の自己負担が軽くなる制度です。対象になりそうですが、金額は所得や自治体で変わるため記事でご確認ください",
    });
  } else {
    items.push({
      name: "お住まいの地域の制度",
      status: "要確認",
      note: "東京都以外の制度はまだ対応していません。国の制度(児童扶養手当)のみ診断しています",
    });
  }

  return { items, totalMonthlyYen, missingInfo };
}
