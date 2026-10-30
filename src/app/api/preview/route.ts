import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

// Notionの「記事タイトル」列の横に追加したプレビュー用formula列から
// 飛んでくる想定。secretが合っていれば、下書き(公開前)の記事でも見られる
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const id = searchParams.get("id");

  if (!id) {
    return new Response("id is required", { status: 400 });
  }
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response("Invalid secret", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(`/kiji/${id}`);
}
