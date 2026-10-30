import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

// NotionのページID(32桁の16進数)は、プレビューURLの中ではハイフン無しで
// 保存されている。記事ページ側は正式なハイフン付きUUID形式を前提にしている
// ため、ここで揃えておかないと同じ記事が別IDとして閲覧数に記録されてしまう
function toHyphenatedUuid(id: string): string {
  const bare = id.replace(/-/g, "");
  if (bare.length !== 32) return id;
  return `${bare.slice(0, 8)}-${bare.slice(8, 12)}-${bare.slice(12, 16)}-${bare.slice(16, 20)}-${bare.slice(20)}`;
}

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
  redirect(`/kiji/${toHyphenatedUuid(id)}`);
}
