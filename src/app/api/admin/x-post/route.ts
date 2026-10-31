import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

export async function POST(req: Request) {
  const appKey = process.env.X_API_KEY;
  const appSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    return NextResponse.json(
      { error: "X APIの認証情報が設定されていません" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const replyText =
    typeof body?.replyText === "string" ? body.replyText.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "本文は必須です" }, { status: 400 });
  }

  const client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
  const rw = client.readWrite;

  try {
    const { data: mainTweet } = await rw.v2.tweet(text);

    if (replyText) {
      await rw.v2.reply(replyText, mainTweet.id);
    }

    return NextResponse.json({
      ok: true,
      tweetUrl: `https://x.com/hahanavi_info/status/${mainTweet.id}`,
    });
  } catch (err) {
    console.error("[x-post] failed", err);
    return NextResponse.json({ error: "投稿に失敗しました" }, { status: 502 });
  }
}
