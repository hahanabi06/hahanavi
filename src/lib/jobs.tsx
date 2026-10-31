import {
  IconHeartHandshake,
  IconStethoscope,
  IconMicroscope,
  IconDental,
  IconBabyCarriage,
} from "@tabler/icons-react";

// トップページの「おすすめのお仕事」の横スクロール一覧と、/shigoto の一覧ページで
// 同じデータを使う(別々に持つと内容がズレていく)。
// 2026年10月、厚労省統計等をもとに年収・求人動向・取得期間を調べたうえで選んだ5つ。
// 詳しい調査結果の出典はnote内に記載。
export type JobBadge = "資格支援あり" | "未経験から目指せる" | "短期取得";

export type Job = {
  icon: typeof IconHeartHandshake;
  title: string;
  income: string;
  demand: string;
  period: string;
  badges: JobBadge[];
  detail: string;
};

export const JOBS: Job[] = [
  {
    icon: IconHeartHandshake,
    title: "介護福祉士",
    income: "年収 約370万〜420万円",
    demand: "求人倍率3.71倍(全職業平均の2倍以上)",
    period: "実務3年+研修、または養成施設で2年",
    badges: ["未経験から目指せる", "資格支援あり"],
    detail:
      "働きながら実務経験を積んで資格を取れるから、収入を途切れさせずに目指しやすいよ。求人も多くて、夜勤ありの施設からデイサービスのような日勤のみの職場まで、働き方を選びやすいのも魅力。",
  },
  {
    icon: IconStethoscope,
    title: "看護師",
    income: "年収 約525万円",
    demand: "求人倍率2.51倍(ここ10年で最高水準)",
    period: "専門学校・短大で3年、大学なら4年",
    badges: ["資格支援あり"],
    detail:
      "収入・求人の多さともに高水準。夜勤がある職場が多いけど、クリニックや健診センターなど日勤のみ・時短可の職場も選べるから、働き方は求人を見ながら相談してみてね。",
  },
  {
    icon: IconMicroscope,
    title: "臨床検査技師",
    income: "年収 約430万〜450万円",
    demand: "求人倍率1.83倍(売り手市場)",
    period: "専門学校・短大で3年、大学なら4年",
    badges: ["資格支援あり"],
    detail:
      "血液検査や心電図など、病院の検査室で働く仕事。夜勤が少なめで、収入・求人倍率のバランスが良い資格だよ。",
  },
  {
    icon: IconDental,
    title: "歯科衛生士",
    income: "年収 約380万円",
    demand: "求人がずっと足りていない状態が続いている",
    period: "専門学校・短大で3年",
    badges: ["資格支援あり"],
    detail:
      "歯科医院で働く仕事。日勤中心で土日休みの医院も多く、求人の強さはこの中でもトップクラス。",
  },
  {
    icon: IconBabyCarriage,
    title: "保育士",
    income: "年収 約380万〜420万円",
    demand: "求人倍率2.4〜3.9倍(慢性的な人手不足)",
    period: "最短2年",
    badges: ["資格支援あり", "短期取得"],
    detail:
      "子どもが好きな人に。取得期間が短めで、時短勤務できる園も多く、夜勤もほぼないから子育てと両立しやすいよ。",
  },
];
