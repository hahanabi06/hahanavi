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

// JST(UTC+9、サマータイムなし)の「今日の0時」「今週の月曜0時」「今月1日の0時」を、
// 実際のUTCタイムスタンプ(ms)として求める
function jstPeriodStarts(now: number) {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const shifted = new Date(now + JST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  const dow = shifted.getUTCDay(); // 0=日曜〜6=土曜
  const daysSinceMonday = (dow + 6) % 7; // 月曜始まり

  const todayStart = Date.UTC(y, m, d) - JST_OFFSET_MS;
  const weekStart = Date.UTC(y, m, d - daysSinceMonday) - JST_OFFSET_MS;
  const monthStart = Date.UTC(y, m, 1) - JST_OFFSET_MS;
  return { todayStart, weekStart, monthStart };
}

function aggregateViews(rows: ViewRow[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const { todayStart, weekStart, monthStart } = jstPeriodStarts(now);

  function countsFor(periodStart: number) {
    const inPeriod = rows.filter(
      (r) => new Date(r.created_at).getTime() >= periodStart,
    );
    const pv = inPeriod.length;
    const uu = new Set(
      inPeriod.map((r) => r.visitor_id).filter((v): v is string => !!v),
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
    today: countsFor(todayStart),
    thisWeek: countsFor(weekStart),
    thisMonth: countsFor(monthStart),
    topPaths,
    topReferrers,
    daily,
  };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function BarChart({ data }: { data: { label: string; pv: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.pv));
  return (
    <div className="flex h-16 items-end gap-1.5">
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
    totalPageViewsRes,
    totalVisitorIdsRes,
    totalFollowsRes,
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
    // 累計(全期間)の数字は、直近30日の絞り込みとは別に軽量なcountクエリで取る
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase.from("page_views").select("visitor_id"),
    supabase.from("line_follows").select("*", { count: "exact", head: true }),
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
  // 今月(JST基準)のファネル用の数字。直近30日分はすでに取得済みなので、
  // 新しいサイトなら月初も確実にその範囲に収まる(範囲外の月はほぼ0件扱いになるだけ)
  const thisMonthKey = jstDateKey(new Date()).slice(0, 7); // "YYYY-MM"
  const thisMonthViews = (viewsRes.data ?? []).filter((r) =>
    jstDateKey(new Date(r.created_at)).startsWith(thisMonthKey),
  );
  const thisMonthPV = thisMonthViews.length;
  const thisMonthUU = new Set(
    thisMonthViews.map((r) => r.visitor_id).filter((v): v is string => !!v),
  ).size;
  const thisMonthLineFollows = follows.filter((f) =>
    jstDateKey(new Date(f.created_at)).startsWith(thisMonthKey),
  ).length;

  const totalStats = {
    pv: totalPageViewsRes.count ?? 0,
    uu: new Set(
      (totalVisitorIdsRes.data ?? [])
        .map((r) => r.visitor_id)
        .filter((v): v is string => !!v),
    ).size,
    lineFriends: totalFollowsRes.count ?? 0,
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
      <div className="flex flex-col lg:flex-row">
        <aside className="flex w-full flex-col border-b border-[#E3E0D6] bg-[#F7F5EF] px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-6">
          <div className="mb-3 flex items-center justify-between lg:mb-6">
            <p className="text-lg font-medium">管理画面</p>
          </div>
          <p className="mb-2 text-xs font-medium text-[#888780]">ポータル</p>
          <nav className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {PORTAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg px-3 py-2 text-sm leading-snug hover:bg-[#F1EFE8] lg:shrink"
              >
                <span className="block font-medium">{link.label}</span>
                <span className="hidden text-xs text-[#888780] lg:block">
                  {link.sub}
                </span>
              </a>
            ))}
          </nav>
          <div className="pt-3 lg:mt-auto lg:pt-4">
            <AdminLogoutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-6">
          <section className="mb-8">
            <p className="mb-3 text-lg font-medium">アクセス解析</p>

            <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium text-[#888780]">
                  今月実績
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  {[
                    { label: "PV", value: thisMonthPV },
                    { label: "UU", value: thisMonthUU },
                    { label: "LINE登録", value: thisMonthLineFollows },
                  ].map((step, i, arr) => {
                    const prevValue = i > 0 ? arr[i - 1].value : null;
                    const rate =
                      prevValue && prevValue > 0
                        ? Math.round((step.value / prevValue) * 100)
                        : null;
                    return (
                      <div key={step.label} className="flex items-center gap-2">
                        {i > 0 && (
                          <div className="flex shrink-0 flex-col items-center gap-0.5 text-[10px] text-[#888780]">
                            <div className="h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-[#C9B9A8]" />
                            {rate !== null && <span>{rate}%</span>}
                          </div>
                        )}
                        <div className="w-20 shrink-0 rounded-xl bg-[#FAECE7] px-3 py-2.5 lg:w-24">
                          <p className="text-xs text-[#993C1D]">{step.label}</p>
                          <p className="text-xl font-medium text-[#712B13]">
                            {step.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="shrink-0">
                <p className="mb-2 text-xs font-medium text-[#888780]">
                  累計(全期間)
                </p>
                <div className="flex gap-2 overflow-x-auto pb-0.5">
                  <div className="w-20 shrink-0 rounded-xl bg-[#F1EFE8] px-3 py-2.5 lg:w-24">
                    <p className="text-xs text-[#888780]">総PV</p>
                    <p className="text-xl font-medium">{totalStats.pv}</p>
                  </div>
                  <div className="w-20 shrink-0 rounded-xl bg-[#F1EFE8] px-3 py-2.5 lg:w-24">
                    <p className="text-xs text-[#888780]">総UU</p>
                    <p className="text-xl font-medium">{totalStats.uu}</p>
                  </div>
                  <div className="w-20 shrink-0 rounded-xl bg-[#F1EFE8] px-3 py-2.5 lg:w-24">
                    <p className="text-xs text-[#888780]">LINE友達数</p>
                    <p className="text-xl font-medium">
                      {totalStats.lineFriends}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-col gap-3 lg:flex-row">
              <div className="grid grid-cols-1 gap-1.5 lg:w-56 lg:shrink-0">
                <div className="rounded-xl bg-[#F1EFE8] px-2.5 py-2">
                  <p className="text-[10px] text-[#888780]">本日</p>
                  <p className="text-lg font-medium">
                    {views.today.pv}
                    <span className="text-xs font-normal text-[#888780]">
                      {" "}
                      PV / {views.today.uu} UU
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-[#F1EFE8] px-2.5 py-2">
                  <p className="text-[10px] text-[#888780]">今週(月曜〜)</p>
                  <p className="text-lg font-medium">
                    {views.thisWeek.pv}
                    <span className="text-xs font-normal text-[#888780]">
                      {" "}
                      PV / {views.thisWeek.uu} UU
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-[#F1EFE8] px-2.5 py-2">
                  <p className="text-[10px] text-[#888780]">今月</p>
                  <p className="text-lg font-medium">
                    {views.thisMonth.pv}
                    <span className="text-xs font-normal text-[#888780]">
                      {" "}
                      PV / {views.thisMonth.uu} UU
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#F1EFE8] px-4 py-3 lg:w-1/3 lg:shrink-0">
                <p className="mb-3 text-sm font-medium">
                  日別PV推移(過去14日間)
                </p>
                <BarChart data={views.daily} />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="min-w-0 rounded-xl bg-[#F1EFE8] px-4 py-3 lg:flex-1">
                <p className="mb-2 text-sm font-medium">
                  人気ページ(過去30日間)
                </p>
                {views.topPaths.length > 0 ? (
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
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

              <div className="min-w-0 rounded-xl bg-[#F1EFE8] px-4 py-3 lg:flex-1">
                <p className="mb-2 text-sm font-medium">
                  流入元(過去30日間)
                </p>
                {views.topReferrers.length > 0 ? (
                  <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
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

              <div className="min-w-0 rounded-xl bg-[#F1EFE8] px-4 py-3 lg:flex-1">
                <p className="mb-2 text-sm font-medium">
                  直近のアクセス(ユーザー別)
                </p>
                {recentVisitors.length > 0 ? (
                  <div className="flex max-h-32 flex-col gap-2 overflow-y-auto">
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
              <div>
                <p className="mb-3 text-lg font-medium">
                  ページの修正依頼({pageReports.length}件)
                </p>
                {pageReports.length === 0 ? (
                  <p className="text-sm text-[#888780]">まだありません。</p>
                ) : (
                  <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
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
                        <p className="mt-1 whitespace-pre-wrap">
                          {row.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-lg font-medium">
                  ご報告・ご要望({requestReports.length}件)
                </p>
                {requestReports.length === 0 ? (
                  <p className="text-sm text-[#888780]">まだありません。</p>
                ) : (
                  <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                    {requestReports.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-xl bg-[#F1EFE8] px-3.5 py-3 text-sm leading-relaxed"
                      >
                        <p className="mb-1 text-xs text-[#888780]">
                          {formatDate(row.created_at)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">
                          {row.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-lg font-medium">
                  企業からの問い合わせ({inquiries.length}件)
                </p>
                {inquiries.length === 0 ? (
                  <p className="text-sm text-[#888780]">まだありません。</p>
                ) : (
                  <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
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
              </div>

              <div>
                <p className="mb-3 text-lg font-medium">
                  LINEのやりとり({lineConversations.length}人)
                </p>
                {lineConversations.length === 0 ? (
                  <p className="text-sm text-[#888780]">まだありません。</p>
                ) : (
                  <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
                    {lineConversations.map(({ userId, profile, messages }) => (
                      <div
                        key={userId}
                        className="rounded-xl bg-[#F1EFE8] px-4 py-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#888780]">
                          <span>区: {profile?.ward ?? "不明"}</span>
                          <span>子供: {profile?.num_children ?? "不明"}</span>
                          <span>
                            年収: {profile?.income_man_yen ?? "不明"}万円
                          </span>
                          <span className="ml-auto">
                            最終:{" "}
                            {formatDate(messages[messages.length - 1].created_at)}
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
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
