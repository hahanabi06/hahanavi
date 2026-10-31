import { cacheLife } from "next/cache";
import { BearParentChild } from "@/components/Bear";

const MESSAGES = [
  "今日、しんどかったね。ここにいるよ。",
  "がんばってる自分、ちゃんと褒めてあげてね。",
  "ひとりで抱え込まなくて大丈夫だよ。",
  "今日も一日、本当にお疲れさま。",
  "困ったときは、いつでも覗きにきてね。",
  "少しずつでいいよ、一緒に進んでいこう。",
  "それでいいよ、今日もよくやった。",
];

// 「。」で区切り、2文以上あるメッセージは文の切れ目で改行して読みやすくする
function splitLines(text: string): string[] {
  return text.split("。").filter(Boolean);
}

// 1日に1回しか変わらない値なので、都度サーバーに取りに行く(Suspenseで動的化)
// のではなく、"use cache"で静的ページの一部として焼き込み、1時間おきに
// 再計算する。これで初期表示から常に正しいメッセージが出て、ラグが一切出ない。
async function getTodaysMessage(): Promise<string> {
  "use cache";
  cacheLife("hours");
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / 86400000,
  );
  return MESSAGES[dayOfYear % MESSAGES.length];
}

export async function BearGreeting() {
  const lines = splitLines(await getTodaysMessage());

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
      <BearParentChild size={56} />
      <p className="font-heading text-body leading-relaxed">
        {lines.map((line, i) => (
          <span key={i}>
            {line}。
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    </div>
  );
}
