import {
  IconStethoscope,
  IconBabyCarriage,
  IconHeartHandshake,
  IconKeyboard,
} from "@tabler/icons-react";

// トップページの「おすすめ資格」の横スクロール一覧と、/shikaku の一覧ページで
// 同じデータを使う(別々に持つと内容がズレていく)。
export const QUALIFICATIONS = [
  {
    icon: IconStethoscope,
    label: "医療事務",
    note: "給付金で実質無料",
    detail:
      "病院やクリニックの受付・会計・レセプト業務。未経験から始めやすく、全国どこでも求人がある。高等職業訓練促進給付金などの対象講座になっていることが多いよ。",
  },
  {
    icon: IconBabyCarriage,
    label: "保育士",
    note: "需要が高く安定",
    detail:
      "保育園・こども園などで働く国家資格。人手不足でどこの地域でも求人が多く、資格取得支援の対象にもなりやすいよ。",
  },
  {
    icon: IconHeartHandshake,
    label: "介護職",
    note: "未経験でも可",
    detail:
      "介護福祉士などの資格。高等職業訓練促進給付金の代表的な対象資格で、修業中の生活費支援が手厚いのが特徴だよ。",
  },
  {
    icon: IconKeyboard,
    label: "PCスキル",
    note: "在宅ワークに",
    detail:
      "MOS(Word/Excel)やWebデザインなど。在宅ワークや時短勤務に繋がりやすく、自立支援教育訓練給付金(受講料の60%)の対象講座も多いよ。",
  },
];
