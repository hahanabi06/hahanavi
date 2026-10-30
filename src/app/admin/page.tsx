import { connection } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { listPublishedArticles } from "@/lib/notion";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { LinePushForm } from "@/components/LinePushForm";
import programsData from "@/data/programs.json";

const STATIC_PATH_LABEL: Record<string, string> = {
  "/": "トップページ",
  "/kiji": "お役立ち記事一覧",
  "/seido": "支援制度一覧",
  "/company": "企業の方へ",
  "/shigyo": "士業の方へ",
  "/about": "運営者情報",
  "/privacy": "プライバシーポリシー",
  "/terms": "利用規約",
};

export const instant = false;
export const metadata = { title: "管理画面 | ハハナビ" };

const JST = "Asia/Tokyo";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(d: Date): string {
  return d.toLocaleDateString("ja-JP", { timeZone: JST, month: "numeric", day: "numeric" });
}

// 日付の比較・加減算はUTCのまま行い、表示(年月日の切り出し)だけJSTにする。
// サーバーの実行環境がUTCでも、JSTの「今日」の境界で正しく集計されるようにする
function jstDateKey(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: JST }); // "YYYY-MM-DD"形式
}

const SOURCE_LABEL: Record<string, string> = {
  program_detail: "制度詳細ページ",
  homepage_request: "トップページの要望フォーム",
  article: "記事ページ",
};

const PORTAL_LINKS = [
  {
    label: "Vercel",
    sub: "アクセス解析・デプロイ状況",
    href: "https://vercel.com/hahanabi/hahanavi/analytics",
  },
  {
    label: "Supabase",
    sub: "データベース",
    href: "https://supabase.com/dashboard/project/uayduadzycdptwmhoaqj",
  },
  {
    label: "Notion",
    sub: "記事の編集",
    href: "https://www.notion.so/407d711ec25a80c5a4aedc433cb805b0",
  },
  {
    label: "GitHub",
    sub: "ソースコード",
    href: "https://github.com/hahanabi06/hahanavi",
  },
  {
    label: "LINE公式アカウント",
    sub: "管理画面",
    href: "https://manager.line.biz/",
  },
  { label: "Gmail", sub: "メール", href: "https://mail.google.com/mail/" },
  { label: "X", sub: "旧Twitter", href: "https://x.com/home?lang=ja" },
];

type ViewRow = {
  path: string;
  visitor_id: string | null;
  created_at: string;
  referrer?: string | null;
  user_agent?: string | null;
};

function deviceLabel(ua: string | null | undefined): { label: string; suspicious: boolean } {
  if (!ua) return { label: "不明", suspicious: false };
  const isClaude = ua.includes("Claude/");
  const isAndroid = /Android/i.test(ua);
  const isIPhone = /iPhone/i.test(ua);
  const isIPad = /iPad/i.test(ua);
  const isMac = /Macintosh/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isBotLike =
    /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptimerobot/i.test(ua);

  let device = "その他";
  if (isIPhone) device = "iPhone";
  else if (isIPad) device = "iPad";
  else if (isAndroid) device = "Android";
  else if (isMac) device = "Mac";
  else if (isWindows) device = "Windows";

  let browser = "";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";

  const label = [device, browser].filter(Boolean).join(" / ") || "その他";
  const suspicious = isClaude || isBotLike || (isAndroid && /Pixel/i.test(ua));
  return { label: isClaude ? `${label}(Claude内蔵ブラウザ)` : label, suspicious };
}

type VisitorSummary = {
  key: string;
  device: ReturnType<typeof deviceLabel>;
  lastSeen: string;
  count: number;
  paths: string[];
};

// 同じ人が何ページも見ると「直近のアクセス」が同じ人で埋まってしまうので、
// visitor_id(無ければUA)でまとめて、ユーザー単位で最新順に表示する
function summarizeVisitors(rows: ViewRow[], limit: number): VisitorSummary[] {
  const groups = new Map<string, ViewRow[]>();
  for (const row of rows) {
    const key = row.visitor_id ?? `ua:${row.user_agent ?? "不明"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const summaries: VisitorSummary[] = Array.from(groups.entries()).map(([key, rowsForKey]) => {
    const sorted = [...rowsForKey].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const paths: string[] = [];
    for (const r of sorted) {
      if (!paths.includes(r.path)) paths.push(r.path);
      if (paths.length >= 5) break;
    }
    return {
      key,
      device: deviceLabel(sorted[0].user_agent),
      lastSeen: sorted[0].created_at,
      count: rowsForKey.length,
      paths,
    };
  });
  summaries.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  return summaries.slice(0, limit);
}

function referrerLabel(referrer: string | null | undefined): string {
  if (referrer === "line-app-link") return "LINE";
  if (!referrer) return "直接アクセス";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("x.com") || host.includes("twitter.com")) return "X(旧Twitter)";
    if (host.includes("google.")) return "Google検索";
    if (host.includes("line.me") || host.includes("line-apps.com")) return "LINE";
    return host;
  } catch {
    return "直接アクセス";
  }
}

function aggregateViews(rows: ViewRow[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  function countsFor(windowMs: number) {
    const inWindow = rows.filter(
      (r) => now - new Date(r.created_at).getTime() <= windowMs,
    );
    const pv = inWindow.length;
    const uu = new Set(
      inWindow.map((r) => r.visitor_id).filter((v): v is string => !!v),
    ).size;
    return { pv, uu };
  }

  const pathCounts = new Map<string, number>();
  for (const row of rows) {
    pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
  }
  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const referrerCounts = new Map<string, number>();
  for (const row of rows) {
    const label = referrerLabel(row.referrer);
    referrerCounts.set(label, (referrerCounts.get(label) ?? 0) + 1);
  }
  const topReferrers = Array.from(referrerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // daily PV for the last 14 days(JST基準), oldest first
  const countByDayKey = new Map<string, number>();
  for (const row of rows) {
    const key = jstDateKey(new Date(row.created_at));
    countByDayKey.set(key, (countByDayKey.get(key) ?? 0) + 1);
  }
  const daily: { label: string; pv: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * day);
    const key = jstDateKey(d);
    daily.push({ label: formatDay(d), pv: countByDayKey.get(key) ?? 0 });
  }

  return {
    last24h: countsFor(day),
    last7d: countsFor(7 * day),
    last30d: countsFor(30 * day),
    topPaths,
    topReferrers,
    daily,
  };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function countInWindow(rows: { created_at: string }[], windowMs: number) {
  const now = Date.now();
  return rows.filter((r) => now - new Date(r.created_at).getTime() <= windowMs)
    .length;
}

function BarChart({ data }: { data: { label: string; pv: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.pv));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex flex-1 flex-col items-center gap-1"
        >
          <div
            className="w-full rounded-t bg-[#D85A30]"
            style={{ height: `${Math.max(2, (d.pv / max) * 100)}%` }}
            title={`${d.label}: ${d.pv}`}
          />
          <span className="text-[10px] text-[#888780]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboard() {
  await connection();
  const supabase = getSupabaseServerClient();
  const thirtyDaysAgo = daysAgoIso(30);

  const [
    inquiriesRes,
    reportsRes,
    viewsRes,
    followsRes,
    lineUsersRes,
    lineMessagesRes,
    articles,
  ] = await Promise.all([
    supabase
      .from("company_inquiries")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("program_reports")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("page_views")
      .select("path, visitor_id, created_at, referrer, user_agent")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false }),
    supabase
      .from("line_follows")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("line_users")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(50),
    supabase
      .from("line_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
    listPublishedArticles().catch(() => []),
  ]);

  const inquiries = inquiriesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  // 「この情報間違ってるかも?」系(ページの修正依頼)と、ホームの要望フォームとで
  // 性質が違うので画面上は別セクションに分ける
  const pageReports = reports.filter(
    (r) => r.source === "program_detail" || r.source === "article",
  );
  const requestReports = reports.filter((r) => r.source === "homepage_request");
  const views = aggregateViews(viewsRes.data ?? []);
  const recentVisitors = summarizeVisitors((viewsRes.data ?? []) as ViewRow[], 20);
  const follows = followsRes.data ?? [];
  const lineUsers = lineUsersRes.data ?? [];
  const lineUserById = new Map(lineUsers.map((u) => [u.line_user_id, u]));

  type LineMessageRow = {
    line_user_id: string;
    text: string;
    created_at: string;
  };
  const messagesByUser = new Map<string, LineMessageRow[]>();
  for (const m of (lineMessagesRes.data ?? []) as LineMessageRow[]) {
    const list = messagesByUser.get(m.line_user_id) ?? [];
    list.push(m);
    messagesByUser.set(m.line_user_id, list);
  }
  const lineConversations = Array.from(messagesByUser.entries())
    .map(([userId, messages]) => ({
      userId,
      profile: lineUserById.get(userId),
      // 新着順で取得してるので、表示用に古い→新しいへ並べ直す
      messages: [...messages].reverse(),
    }))
    .sort(
      (a, b) =>
        new Date(b.messages[b.messages.length - 1].created_at).getTime() -
        new Date(a.messages[a.messages.length - 1].created_at).getTime(),
    );
  const day = 24 * 60 * 60 * 1000;
  const followCounts = {
    last24h: countInWindow(follows, day),
    last7d: countInWindow(follows, 7 * day),
    last30d: follows.length,
  };

  const articleTitleById = new Map(articles.map((a) => [a.id, a.title]));
  const programNameById = new Map(
    programsData.programs.map((p) => [p.id, p.name]),
  );
  function labelForPath(path: string): string {
    if (STATIC_PATH_LABEL[path]) return STATIC_PATH_LABEL[path];

    const kijiMatch = path.match(/^\/kiji\/(.+)$/);
    if (kijiMatch) {
      const title = articleTitleById.get(kijiMatch[1]);
      return title ? `記事: ${title}` : "記事(削除済み?)";
    }

    const seidoMatch = path.match(/^\/seido\/(.+)$/);
    if (seidoMatch) {
      const name = programNameById.get(seidoMatch[1]);
      return name ? `制度: ${name}` : "制度ページ";
    }

    return path;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[#E3E0D6] bg-[#F7F5EF] px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-lg font-medium">管理画面</p>
          </div>
          <p className="mb-2 text-xs font-medium text-[#888780]">ポータル</p>
          <nav className="flex flex-col gap-1">
            {PORTAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm leading-snug hover:bg-[#F1EFE8]"
              >
                <span className="block font-medium">{link.label}</span>
                <span className="block text-xs text-[#888780]">
                  {link.sub}
                </span>
              </a>
            ))}
          </nav>
          <div className="mt-auto pt-4">
            <AdminLogoutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-6">
          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">アクセス解析</p>
            <div className="flex flex-wrap gap-3">
              <div className="w-72 shrink-0">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-xl bg-[#F1EFE8] px-2.5 py-2">
                    <p className="text-[10px] text-[#888780]">24時間</p>
                    <p className="text-lg font-medium">
                      {views.last24h.pv}
                      <span className="text-xs font-normal text-[#888780]">
                        {" "}
                        PV
                      </span>
                    </p>
                    <p className="text-xs text-[#5F5E5A]">
                      {views.last24h.uu} UU
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F1EFE8] px-2.5 py-2">
                    <p className="text-[10px] text-[#888780]">7日間</p>
                    <p className="text-lg font-medium">
                      {views.last7d.pv}
                      <span className="text-xs font-normal text-[#888780]">
                        {" "}
                        PV
                      </span>
                    </p>
                    <p className="text-xs text-[#5F5E5A]">
                      {views.last7d.uu} UU
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F1EFE8] px-2.5 py-2">
                    <p className="text-[10px] text-[#888780]">30日間</p>
                    <p className="text-lg font-medium">
                      {views.last30d.pv}
                      <span className="text-xs font-normal text-[#888780]">
                        {" "}
                        PV
                      </span>
                    </p>
                    <p className="text-xs text-[#5F5E5A]">
                      {views.last30d.uu} UU
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-[#F1EFE8] px-4 py-3">
                  <p className="mb-3 text-sm font-medium">
                    日別PV推移(過去14日間)
                  </p>
                  <BarChart data={views.daily} />
                </div>
              </div>

              <div className="w-72 shrink-0 rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="mb-2 text-sm font-medium">
                  人気ページ(過去30日間)
                </p>
                {views.topPaths.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {views.topPaths.map(([path, count]) => (
                      <div
                        key={path}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-[#5F5E5A]">
                          {labelForPath(path)}
                        </span>
                        <span className="shrink-0 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#888780]">
                    まだデータがありません。
                  </p>
                )}
              </div>

              <div className="w-72 shrink-0 rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="mb-2 text-sm font-medium">
                  流入元(過去30日間)
                </p>
                {views.topReferrers.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {views.topReferrers.map(([label, count]) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-[#5F5E5A]">
                          {label}
                        </span>
                        <span className="shrink-0 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#888780]">
                    まだデータがありません。
                  </p>
                )}
              </div>

              <div className="w-80 shrink-0 rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="mb-2 text-sm font-medium">
                  直近のアクセス(ユーザー別)
                </p>
                {recentVisitors.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {recentVisitors.map((v) => (
                      <div
                        key={v.key}
                        className="rounded-lg bg-white/60 px-2.5 py-2 text-xs"
                      >
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className="text-[#888780]">
                            {formatDate(v.lastSeen)}
                          </span>
                          <span
                            className={`ml-auto shrink-0 ${v.device.suspicious ? "font-medium text-[#D85A30]" : "text-[#5F5E5A]"}`}
                          >
                            {v.device.suspicious ? "⚠ " : ""}
                            {v.device.label}
                          </span>
                        </div>
                        <p className="truncate text-[#5F5E5A]">
                          {v.paths.map(labelForPath).join(" / ")}
                          {v.count > v.paths.length && ` (他${v.count - v.paths.length}件)`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#888780]">
                    まだデータがありません。
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">
              LINE登録(CV)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#FAECE7] px-4 py-3">
                <p className="text-xs text-[#993C1D]">過去24時間</p>
                <p className="text-2xl font-medium text-[#712B13]">
                  {followCounts.last24h}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAECE7] px-4 py-3">
                <p className="text-xs text-[#993C1D]">過去7日間</p>
                <p className="text-2xl font-medium text-[#712B13]">
                  {followCounts.last7d}
                </p>
              </div>
              <div className="rounded-xl bg-[#FAECE7] px-4 py-3">
                <p className="text-xs text-[#993C1D]">過去30日間</p>
                <p className="text-2xl font-medium text-[#712B13]">
                  {followCounts.last30d}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">
              ページの修正依頼({pageReports.length}件)
            </p>
            {pageReports.length === 0 ? (
              <p className="text-sm text-[#888780]">まだありません。</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pageReports.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl bg-[#F1EFE8] px-3.5 py-3 text-sm leading-relaxed"
                  >
                    <p className="mb-1 text-xs text-[#888780]">
                      {formatDate(row.created_at)} ・{" "}
                      {SOURCE_LABEL[row.source] ?? row.source}
                    </p>
                    {row.program_name && (
                      <p className="font-medium">{row.program_name}</p>
                    )}
                    <p className="mt-1 whitespace-pre-wrap">{row.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">
              ご報告・ご要望({requestReports.length}件)
            </p>
            {requestReports.length === 0 ? (
              <p className="text-sm text-[#888780]">まだありません。</p>
            ) : (
              <div className="flex flex-col gap-2">
                {requestReports.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl bg-[#F1EFE8] px-3.5 py-3 text-sm leading-relaxed"
                  >
                    <p className="mb-1 text-xs text-[#888780]">
                      {formatDate(row.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{row.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">
              企業からの問い合わせ({inquiries.length}件)
            </p>
            {inquiries.length === 0 ? (
              <p className="text-sm text-[#888780]">まだありません。</p>
            ) : (
              <div className="flex flex-col gap-2">
                {inquiries.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl bg-[#F1EFE8] px-3.5 py-3 text-sm leading-relaxed"
                  >
                    <p className="mb-1 text-xs text-[#888780]">
                      {formatDate(row.created_at)}
                    </p>
                    <p className="font-medium">
                      {row.company_name}(担当: {row.contact_name})
                    </p>
                    <p>{row.email}</p>
                    {row.phone && <p>{row.phone}</p>}
                    <p className="mt-1">相談内容: {row.interest}</p>
                    {row.message && (
                      <p className="mt-1 whitespace-pre-wrap">
                        {row.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">
              LINEのやりとり({lineConversations.length}人)
            </p>
            {lineConversations.length === 0 ? (
              <p className="text-sm text-[#888780]">まだありません。</p>
            ) : (
              <div className="flex flex-col gap-3">
                {lineConversations.map(({ userId, profile, messages }) => (
                  <div
                    key={userId}
                    className="rounded-xl bg-[#F1EFE8] px-4 py-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#888780]">
                      <span>区: {profile?.ward ?? "不明"}</span>
                      <span>子供: {profile?.num_children ?? "不明"}</span>
                      <span>年収: {profile?.income_man_yen ?? "不明"}万円</span>
                      <span className="ml-auto">
                        最終: {formatDate(messages[messages.length - 1].created_at)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {messages.map((m, i) => (
                        <p key={i} className="text-sm leading-relaxed">
                          <span className="mr-2 text-xs text-[#888780]">
                            {formatDate(m.created_at)}
                          </span>
                          {m.text}
                        </p>
                      ))}
                    </div>
                    <LinePushForm lineUserId={userId} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
