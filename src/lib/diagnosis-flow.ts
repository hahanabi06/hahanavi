// LINEのボタン(クイックリプライ)で地域・子供の人数・年収を順番に聞いていく、
// 診断フローの状態遷移をまとめたもの。state(line_usersのmode列、JSON文字列)を
// 1ステップずつ進めながら、最終的にdiagnosis.tsのdiagnose()に渡す値を組み立てる。

export const REGIONS: { name: string; prefectures: string[] }[] = [
  { name: "北海道・東北", prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { name: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

export const WARD_AREAS: { name: string; wards: string[] }[] = [
  { name: "都心エリア", wards: ["千代田区", "中央区", "港区", "新宿区", "文京区", "台東区"] },
  { name: "城東エリア", wards: ["墨田区", "江東区", "荒川区", "足立区", "葛飾区", "江戸川区"] },
  { name: "城南エリア", wards: ["品川区", "目黒区", "大田区", "世田谷区", "渋谷区"] },
  { name: "城西エリア", wards: ["中野区", "杉並区", "練馬区"] },
  { name: "城北エリア", wards: ["豊島区", "北区", "板橋区"] },
];

export const CHILD_COUNT_OPTIONS = [
  { label: "1人", value: 1 },
  { label: "2人", value: 2 },
  { label: "3人", value: 3 },
  { label: "4人以上", value: 4 },
];

// 診断の所得しきい値(77万円台〜500万円超)をだいたいカバーできる範囲。各帯の代表値で概算診断する
export const INCOME_BRACKET_OPTIONS = [
  { label: "〜100万円", value: 70 },
  { label: "100〜200万円", value: 150 },
  { label: "200〜300万円", value: 250 },
  { label: "300〜400万円", value: 350 },
  { label: "400〜500万円", value: 450 },
  { label: "500万円〜", value: 600 },
];

export type DiagFlowState =
  | { step: "region" }
  | { step: "prefecture"; region: string }
  | { step: "ward_area" ; prefecture: string }
  | { step: "ward"; prefecture: string; wardArea: string }
  | { step: "children"; prefecture: string; ward?: string }
  | { step: "income"; prefecture: string; ward?: string; numChildren: number };

export function encodeState(state: DiagFlowState): string {
  return JSON.stringify(state);
}

export function decodeState(mode: string | null): DiagFlowState | null {
  if (!mode) return null;
  try {
    const parsed = JSON.parse(mode);
    if (parsed && typeof parsed === "object" && typeof parsed.step === "string") {
      return parsed as DiagFlowState;
    }
    return null;
  } catch {
    return null;
  }
}
