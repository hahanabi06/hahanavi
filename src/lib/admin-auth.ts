export const ADMIN_COOKIE_NAME = "hahanavi_admin";

export async function getAdminToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  const data = new TextEncoder().encode(`${password}:hahanavi-admin`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// /admin にログイン済み(=運営者本人)のブラウザかどうかを、
// 公開ページ側のアクセス解析から除外する目的でも使う
export async function isOwnerRequest(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
  if (!match) return false;
  const value = match.slice(ADMIN_COOKIE_NAME.length + 1);
  const expected = await getAdminToken();
  return value === expected;
}
