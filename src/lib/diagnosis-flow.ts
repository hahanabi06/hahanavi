// LINEのボタン(クイックリプライ)で地域・子供の人数・年収を順番に聞いていく、
// 診断フローの状態遷移をまとめたもの。state(line_usersのmode列、JSON文字列)を
// 1ステップずつ進めながら、最終的にdiagnosis.tsのdiagnose()に渡す値を組み立てる。
import { TOKYO_WARDS } from "@/lib/diagnosis";

export const REGIONS: { name: string; prefectures: string[] }[] = [
  { name: "北海道・東北", prefectures: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { name: "関東", prefectures: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { name: "中部", prefectures: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { name: "近畿", prefectures: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { name: "中国", prefectures: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"] },
  { name: "四国", prefectures: ["徳島県", "香川県", "愛媛県", "高知県"] },
  { name: "九州・沖縄", prefectures: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] },
];

// LINEのクイックリプライは1メッセージ最大13個までなので、23区を3ページに分けて出す。
// 「都心/城東」のようなエリア名は馴染みがない人も多いので使わず、単純にページ送りする。
// 各ページに「次の区を見る」「戻る」「やめる」ボタンが乗る分を引いて10+10+3に分割
export const WARD_PAGES: string[][] = [
  TOKYO_WARDS.slice(0, 10),
  TOKYO_WARDS.slice(10, 20),
  TOKYO_WARDS.slice(20),
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

// 子供1人ずつの年齢を、児童手当の金額(3歳未満かどうか)・国保軽減(未就学児がいるか)・
// 高校生等奨学給付金(高校生がいるか)の判定に使える粒度のブラケットで聞く。各帯の代表値で計算する
export const AGE_BRACKET_OPTIONS = [
  { label: "0〜2歳", value: 1 },
  { label: "3〜5歳(未就学)", value: 4 },
  { label: "6〜11歳(小学生)", value: 8 },
  { label: "12〜14歳(中学生)", value: 13 },
  { label: "15〜18歳(高校生)", value: 16 },
  { label: "19歳以上", value: 19 },
];

// 1つ前のステップに「戻る」を実装するため、進むときにそれまで選んだ内容を
// 消さずに引き継いでいく(stepだけ進める/戻すイメージ)。
// childAgeは人数分ループするステップなので、聞き終わった分だけchildAgesに積んでいく
export type DiagFlowState = {
  step: "region" | "prefecture" | "ward" | "children" | "childAge" | "income";
  region?: string;
  prefecture?: string;
  ward?: string;
  numChildren?: number;
  childAges?: number[];
};

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
