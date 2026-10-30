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

export const WELCOME_MESSAGE = `友だち追加ありがとう♪ハハナビ公式アカウントだよ。

シングルマザーが使える支援制度情報やお役立ち情報を届けてるよ。

下のメニューから「支援制度診断」を選べば、あなたが実際にいくらもらえるか診断できるからいつでも試してみてね。他にも便利な機能を開発予定だから待っててね♪

もしハハナビへのご要望等あればご意見箱を押してメッセージを送ってほしいな

※LINEで教えてもらった情報は、求人を探している場合の求人紹介や支援制度の更新等のお知らせに活用させていただく場合があるよ`;
