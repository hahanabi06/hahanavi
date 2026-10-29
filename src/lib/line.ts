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

export type QuickReplyItem = {
  label: string;
  data: string;
};

export async function replyToLine(
  replyToken: string,
  text: string,
  channelAccessToken: string,
  quickReplyItems?: QuickReplyItem[]
): Promise<void> {
  const message: Record<string, unknown> = {
    type: "text",
    text: text.slice(0, 5000),
  };
  if (quickReplyItems && quickReplyItems.length > 0) {
    message.quickReply = {
      items: quickReplyItems.slice(0, 13).map((item) => ({
        type: "action",
        action: {
          type: "postback",
          label: item.label.slice(0, 20),
          data: item.data,
          displayText: item.label,
        },
      })),
    };
  }
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [message],
    }),
  });
}

export async function pushToLine(
  userId: string,
  text: string,
  channelAccessToken: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: text.slice(0, 5000) }],
    }),
  });
  if (res.ok) return { ok: true };
  const body = await res.text().catch(() => "");
  return { ok: false, error: `${res.status} ${body}` };
}

export const WELCOME_MESSAGE = `ハハナビに登録してくれてありがとう。

使えるお金を診断するよ。この1行の形で送ってみてね。

例: 台東区 子供2人 年収300万

国の制度(児童扶養手当)はどこに住んでいても診断できるよ。東京都在住なら児童育成手当も一緒に見るよ。

※診断のために送っていただいた情報(地域・子供の人数・年収など)は、今後の求人紹介やお知らせに活用させていただく場合がございます。`;
