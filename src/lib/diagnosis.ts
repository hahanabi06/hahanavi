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
  window?: string;
  programId?: string;
};

export type DiagnosisResult = {
  items: BenefitResult[];
  totalMonthlyYen: number;
  missingInfo: string[];
};

// 扶養人数(≒子の人数)ごとの所得制限額(万円)。表の最後を超える分は1人につき38万円加算。
const JIDO_FUYOU_FULL_LIMIT = [77, 115, 153];
const JIDO_FUYOU_PARTIAL_LIMIT = [216, 254, 292];
const JIDO_FUYOU_FULL_AMOUNT = [48050, 59400, 70750];
// 一部支給の金額レンジ(1人目の最小・最大、2人目以降1人につき加算される最小・最大)
const JIDO_FUYOU_PARTIAL_MIN_BASE = 11340;
const JIDO_FUYOU_PARTIAL_MAX_BASE = 48040;
const JIDO_FUYOU_PARTIAL_MIN_EXTRA = 5680;
const JIDO_FUYOU_PARTIAL_MAX_EXTRA = 11340;
const JIDO_IKUSEI_LIMIT = [383.8, 421.8, 459.8, 497.8];

// マル親の所得制限(本人・保護者基準、万円)。23区は2パターンに分かれる(23区分を公式サイトで確認済み)。
// 杉並区は3人(322万円)・4人(360万円)分を別ソースでも確認でき、208+38n の式と完全一致(他区の延長計算への信頼度が上がった)。
// 目黒区は検索結果に令和7年1月の改定前(192万円等)の古い値が混在するため、改定後の208/246/284を正として採用。
const MARUOYA_PATTERN_A = [208, 246, 284]; // 千代田・中央・港・新宿・文京・墨田・江東・品川・目黒・大田・世田谷・渋谷・中野・杉並・荒川・足立・葛飾・江戸川・北・板橋
const MARUOYA_PATTERN_B = [216, 254, 292]; // 台東・練馬・豊島
const MARUOYA_PATTERN_B_WARDS = new Set(["台東区", "練馬区", "豊島区"]);

function maruoyaLimitTableForWard(ward: string): number[] {
  return MARUOYA_PATTERN_B_WARDS.has(ward) ? MARUOYA_PATTERN_B : MARUOYA_PATTERN_A;
}

const JIDO_FUYOU_WINDOW = "お住まいの区の子育て支援課給付担当";
const JIDO_IKUSEI_WINDOW = "お住まいの区の子育て支援課給付担当";
const MARUOYA_WINDOW = "お住まいの区の子育て支援課(ひとり親家庭等医療費助成担当)";

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

  // 児童扶養手当(国の制度、全国どこでも対象)
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
      window: JIDO_FUYOU_WINDOW,
      programId: "jidou-fuyou-teate",
    });
    totalMonthlyYen += amount;
  } else if (income < fuyoPartialLimit) {
    const extra = Math.max(0, count - 1);
    const minAmount =
      JIDO_FUYOU_PARTIAL_MIN_BASE + extra * JIDO_FUYOU_PARTIAL_MIN_EXTRA;
    const maxAmount =
      JIDO_FUYOU_PARTIAL_MAX_BASE + extra * JIDO_FUYOU_PARTIAL_MAX_EXTRA;
    items.push({
      name: "児童扶養手当(国)",
      status: "一部支給",
      note: `一部支給の対象になりそうです。所得に応じて月${minAmount.toLocaleString()}円〜${maxAmount.toLocaleString()}円の間になります`,
      window: JIDO_FUYOU_WINDOW,
      programId: "jidou-fuyou-teate",
    });
  } else {
    items.push({
      name: "児童扶養手当(国)",
      status: "対象外",
      note: "所得基準を超えているため対象外の可能性が高いです",
      programId: "jidou-fuyou-teate",
    });
  }

  // 児童育成手当(東京都独自、都内在住なら23区どこでも対象)
  if (input.isTokyo) {
    const ikuseiLimit = limitForCount(JIDO_IKUSEI_LIMIT, count);
    if (income < ikuseiLimit) {
      const amount = 13500 * count;
      items.push({
        name: "児童育成手当(東京都)",
        status: "全部支給",
        note: "東京都在住なら区を問わず対象になりそうです",
        monthlyYen: amount,
        window: JIDO_IKUSEI_WINDOW,
        programId: "jidou-ikusei-teate",
      });
      totalMonthlyYen += amount;
    } else {
      items.push({
        name: "児童育成手当(東京都)",
        status: "対象外",
        note: "所得基準を超えているため対象外の可能性が高いです",
        programId: "jidou-ikusei-teate",
      });
    }

    // マル親医療費助成: 23区それぞれの所得基準で判定(台東・練馬・豊島のみ基準が異なる)
    if (input.ward) {
      const maruoyaTable = maruoyaLimitTableForWard(input.ward);
      const maruoyaLimit = limitForCount(maruoyaTable, count);
      if (income < maruoyaLimit) {
        items.push({
          name: "ひとり親家庭等医療費助成(マル親)",
          status: "全部支給",
          note: `医療費の自己負担がほぼ無料になりそうです(${input.ward}の基準)`,
          window: MARUOYA_WINDOW,
          programId: "maruoya-iryouhi",
        });
      } else {
        items.push({
          name: "ひとり親家庭等医療費助成(マル親)",
          status: "対象外",
          note: `所得基準を超えているため対象外の可能性が高いです(${input.ward}の基準)`,
          programId: "maruoya-iryouhi",
        });
      }
    } else {
      items.push({
        name: "ひとり親家庭等医療費助成(マル親)",
        status: "要確認",
        note: "医療費の自己負担が軽くなる制度です。区が分かるとここも診断できます",
      });
    }
  } else {
    items.push({
      name: "お住まいの地域の制度",
      status: "要確認",
      note: "東京都以外の制度はまだ対応していません。国の制度(児童扶養手当)のみ診断しています",
    });
  }

  // 児童扶養手当の対象(全部・一部支給どちらか)なら、資格取得支援もセットで案内
  if (income < fuyoPartialLimit) {
    items.push({
      name: "資格取得支援(高等職業訓練促進給付金 等)",
      status: "要確認",
      note: "看護師・介護福祉士などの資格取得を目指すなら、月7万円台〜15万円の生活費支援が受けられる可能性があります。資格に興味があれば詳細ページをチェックしてね",
      window: JIDO_FUYOU_WINDOW,
      programId: "koutou-shokugyou-kunren",
    });
  }

  items.push({
    name: "ひとり親控除(税制)",
    status: "要確認",
    note: "所得税・住民税が35万円控除される制度です(本人所得500万円以下が条件)。確定申告か年末調整で忘れずに申請してね",
    programId: "hitorioya-koujo",
  });

  return { items, totalMonthlyYen, missingInfo };
}
