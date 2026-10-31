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
export type JobBadge =
  | "資格支援あり"
  | "未経験から目指せる"
  | "短期取得"
  | "資格なしでも可"
  | "夜勤なしも選べる"
  | "就職しやすい"
  | "将来性あり";

// 4軸評価(1〜5の★)。「資格の取得しやすさ」は仕事そのものの良さではなく資格に
// 辿り着くまでの難易度の話なので、ここには含めない(関連資格セクションで事実として扱う)。
// 採点基準:
// income: 外部の平均(一般労働者平均やシングルマザー平均)とではなく、JOBSに載せている
// 職業どうしを比べた相対評価。僅差(数十万円程度)は同じ星数にまとめる
// hireability: 有効求人倍率が全産業平均(令和6年1.25倍)の何倍かで判定
// flexibility: シフトの選びやすさ(夜勤有無等)+急な休み・早退のしやすさ
// stability: 将来の需要見通し(供給過剰懸念があれば減点)
export type JobRatings = {
  income: number;
  hireability: number;
  flexibility: number;
  stability: number;
};

export type JobRatingNotes = {
  income: string;
  hireability: string;
  flexibility: string;
  stability: string;
};

export type JobRoute = {
  label: string;
  detail: string;
};

// 「働き方の柔軟性」は子どもの年齢で状況が変わる職業がある(夜勤・急な休みへの対応しやすさ等)。
// その場合はratings.flexibilityの単一スコアの代わりにこちらを表示する
export type JobFlexibilityByAge = {
  ageGroup: string;
  score: number;
  note: string;
};

// 年収を一般労働者平均などと棒グラフで比較表示するための数値データ(万円)。
// income(文字列)は一覧カード等の表示用にそのまま残す
export type JobIncomeCompare = {
  label: string;
  amount: number;
};

export type Job = {
  id: string;
  icon: typeof IconHeartHandshake;
  title: string;
  // 仕事内容。評価やおすすめポイントの前に、そもそも何をする仕事かを説明する
  overview: string;
  income: string;
  incomeRange?: { min: number; max: number };
  incomeCompare?: JobIncomeCompare;
  // incomeの金額が特定の前提(有資格者など)に基づく場合の補足
  incomeNote?: string;
  demand: string;
  period: string;
  badges: JobBadge[];
  detail: string;
  // 業務独占資格(資格がないと働けない)など、見逃すと誤解につながる場合のみ使う。
  // 名称独占資格のような軽い注意書きはbadges/overviewに畳み込む
  licenseType?: string;
  licenseNote?: string;
  ratings?: JobRatings;
  ratingNotes?: JobRatingNotes;
  routes?: JobRoute[];
  // 国家試験の合格率など。ルートが複数あっても試験は共通のことが多いので、
  // 資格名の横に1回だけ出す(各ルートのdetailに重複して書かない)
  examPassRate?: { rate: string; note: string };
  // 資格を取ると良いこと(任意取得の職業で、取得ルートの前に「なぜ取るか」を示す)
  licenseBenefits?: string[];
  flexibilityByAge?: JobFlexibilityByAge[];
};

export const JOBS: Job[] = [
  {
    id: "kaigo-fukushishi",
    icon: IconHeartHandshake,
    title: "介護福祉士",
    overview:
      "高齢者や体の不自由な方の食事・入浴・排泄などの介助、着替えや移動のサポートをする仕事。特別養護老人ホームやデイサービス、訪問介護など、働く場所はさまざま。資格がなくても介護の仕事自体には就けるけど、「介護福祉士」を名乗るには資格が必要だよ。",
    income: "年収 約370万〜420万円",
    incomeRange: { min: 370, max: 420 },
    incomeCompare: {
      label: "ひとり親(母子世帯)の母の平均就労収入",
      amount: 236,
    },
    // 資格手当の全国統計が見つからなかったため、具体額は出さず「有資格者の金額」である旨だけ注記する
    incomeNote: "この金額は資格を取ったあと(介護福祉士)の目安だよ",
    demand: "求人倍率3.71倍(全産業平均1.25倍・令和6年の約3倍)",
    period: "実務3年+研修、または養成施設で2年",
    badges: [
      "未経験から目指せる",
      "資格なしでも可",
      "夜勤なしも選べる",
      "就職しやすい",
      "将来性あり",
      "資格支援あり",
    ],
    detail:
      "働きながら実務経験を積んで資格を取れるから、収入を途切れさせずに目指しやすいよ。求人も多くて、夜勤ありの施設からデイサービスのような日勤のみの職場まで、働き方を選びやすいのも魅力。",
    ratings: {
      income: 3,
      hireability: 5,
      flexibility: 4,
      stability: 5,
    },
    ratingNotes: {
      income:
        "ここで紹介している他の職業と比べて、特別高くも低くもない、平均的な水準",
      hireability:
        "求人倍率3.71倍は、全産業平均1.25倍(令和6年)の約3倍の水準。求職者1人に対して求人が3件以上ある計算で、未経験やブランクがあっても採用されやすく、職場を選びながら探しやすい",
      flexibility:
        "夜勤ありの施設から日勤のみのデイサービスまで職場の幅が広く、シフト制で交代しやすい職場が多い",
      stability:
        "厚労省の推計で2040年度に約272万人の介護職員が必要(2022年度比+57万人)。今後も需要拡大が見込まれる",
    },
    licenseBenefits: ["資格手当あり", "転職で有利", "仕事の幅が広がる"],
    examPassRate: { rate: "合格率78.3%", note: "国家試験(第37回・2024年度)" },
    routes: [
      {
        label: "実務経験ルート(働きながら目指せる)",
        detail:
          "介護職として実務経験3年以上を積みながら、実務者研修(450時間以上、標準受講期間6ヶ月)を修了。研修は通信学習+数日程度のスクーリングで、働きながら受けられる講座が多いよ。修了後は介護福祉士国家試験に合格して資格取得。",
      },
      {
        label: "養成施設ルート",
        detail:
          "専門学校や大学などの養成施設に2年以上通学して卒業したあと、介護福祉士国家試験に合格して資格取得。",
      },
    ],
    flexibilityByAge: [
      {
        ageGroup: "未就学児(0〜5歳)",
        score: 3,
        note: "夜間の預け先を確保しづらいから、夜勤なしのデイサービス等を選ぶのが現実的。選べる働き方の幅はやや狭まる",
      },
      {
        ageGroup: "就学後(小学生以上)",
        score: 5,
        note: "学童保育などでカバーしやすくなり、夜勤ありの施設も選択肢に入れやすい。シフトの融通も利く職場が多い",
      },
    ],
  },
  {
    id: "kangoshi",
    icon: IconStethoscope,
    title: "看護師",
    overview:
      "医師の指示のもと、注射や点滴などの医療処置、血圧測定といった健康チェック、療養中の患者さんのお世話をする仕事。病院のほか、クリニックや訪問看護などでも働ける。",
    income: "年収 約525万円",
    demand: "求人倍率2.51倍(ここ10年で最高水準)",
    period: "専門学校・短大で3年、大学なら4年",
    badges: ["資格支援あり"],
    detail:
      "収入・求人の多さともに高水準。夜勤がある職場が多いけど、クリニックや健診センターなど日勤のみ・時短可の職場も選べるから、働き方は求人を見ながら相談してみてね。",
  },
  {
    id: "rinsho-kensagishi",
    icon: IconMicroscope,
    title: "臨床検査技師",
    overview:
      "血液検査や尿検査、心電図、超音波(エコー)検査など、病気の診断に必要なデータを調べる仕事。主に病院や検査センターの検査室で働く。",
    income: "年収 約430万〜450万円",
    demand: "求人倍率1.83倍(売り手市場)",
    period: "専門学校・短大で3年、大学なら4年",
    badges: ["資格支援あり"],
    detail:
      "血液検査や心電図など、病院の検査室で働く仕事。夜勤が少なめで、収入・求人倍率のバランスが良い資格だよ。",
  },
  {
    id: "shika-eiseishi",
    icon: IconDental,
    title: "歯科衛生士",
    overview:
      "歯科医師の診療補助のほか、歯石除去などの歯のクリーニング(歯面清掃)、歯みがき指導を行う仕事。働く場所はほぼ歯科医院。",
    income: "年収 約380万円",
    demand: "求人がずっと足りていない状態が続いている",
    period: "専門学校・短大で3年",
    badges: ["資格支援あり"],
    detail:
      "歯科医院で働く仕事。日勤中心で土日休みの医院も多く、求人の強さはこの中でもトップクラス。",
  },
  {
    id: "hoikushi",
    icon: IconBabyCarriage,
    title: "保育士",
    overview:
      "保育園や認定こども園などで、子どもの食事や着替え、遊びの見守りといった日常のお世話をしながら、成長をサポートする仕事。",
    income: "年収 約380万〜420万円",
    demand: "求人倍率2.4〜3.9倍(慢性的な人手不足)",
    period: "最短2年",
    badges: ["資格支援あり", "短期取得"],
    detail:
      "子どもが好きな人に。取得期間が短めで、時短勤務できる園も多く、夜勤もほぼないから子育てと両立しやすいよ。",
  },
];
