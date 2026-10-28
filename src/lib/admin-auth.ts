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
