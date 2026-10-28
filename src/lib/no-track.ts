export const NO_TRACK_COOKIE_NAME = "hahanavi_no_track";

export function hasNoTrackCookie(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .some((c) => c === `${NO_TRACK_COOKIE_NAME}=1`);
}
