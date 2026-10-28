import crypto from "crypto";

export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
  channelSecret: string
): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");
  return hash === signature;
}

export async function replyToLine(
  replyToken: string,
  text: string,
  channelAccessToken: string
): Promise<void> {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: text.slice(0, 5000) }],
    }),
  });
}

export const WELCOME_MESSAGE = `ハハナビに登録してくれてありがとう。

使えるお金を診断するよ。この1行の形で送ってみてね。

例: 台東区 子供2人 年収300万

国の制度(児童扶養手当)はどこに住んでいても診断できるよ。東京都在住なら児童育成手当も一緒に見るよ。`;
