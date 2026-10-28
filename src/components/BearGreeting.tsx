import { connection } from "next/server";
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

function getTodaysMessage(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / 86400000,
  );
  return MESSAGES[dayOfYear % MESSAGES.length];
}

// 日付で変わる値なのでクライアント側で遅延評価せず、サーバー側でリクエストごとに
// 計算する(connection()でCache Componentsの静的プリレンダー対象から外す)。
// これで初期表示が空になったり違うメッセージが一瞬見えたりしない。
export async function BearGreeting() {
  await connection();
  const lines = splitLines(getTodaysMessage());

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
      <BearParentChild size={56} />
      <p className="text-base leading-relaxed">
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
