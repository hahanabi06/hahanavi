"use client";

import { useEffect, useState } from "react";
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

export function BearGreeting() {
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  }, []);

  const lines = splitLines(message);

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
