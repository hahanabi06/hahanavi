import { connection } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export const instant = false;
export const metadata = { title: "管理画面 | ハハナビ" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SOURCE_LABEL: Record<string, string> = {
  program_detail: "制度詳細ページ",
  homepage_request: "トップページの要望フォーム",
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
    label: "LINE公式アカウント",
    sub: "管理画面",
    href: "https://manager.line.biz/",
  },
  { label: "Gmail", sub: "メール", href: "https://mail.google.com/mail/" },
  { label: "X", sub: "旧Twitter", href: "https://x.com/home" },
];

function aggregateViews(rows: { path: string; created_at: string }[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let last24h = 0;
  let last7d = 0;
  const pathCounts = new Map<string, number>();

  for (const row of rows) {
    const age = now - new Date(row.created_at).getTime();
    if (age <= day) last24h += 1;
    if (age <= 7 * day) last7d += 1;
    pathCounts.set(row.path, (pathCounts.get(row.path) ?? 0) + 1);
  }

  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return { last24h, last7d, last30d: rows.length, topPaths };
}

export default async function AdminDashboard() {
  await connection();
  const supabase = getSupabaseServerClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [inquiriesRes, reportsRes, viewsRes] = await Promise.all([
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
      .select("path, created_at")
      .gte("created_at", thirtyDaysAgo),
  ]);

  const inquiries = inquiriesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const views = aggregateViews(viewsRes.data ?? []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[#E3E0D6] bg-[#F7F5EF] px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-lg font-medium">管理画面</p>
          </div>
          <p className="mb-2 text-xs font-medium text-[#888780]">
            ポータル
          </p>
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
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="text-xs text-[#888780]">過去24時間</p>
                <p className="text-2xl font-medium">{views.last24h}</p>
              </div>
              <div className="rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="text-xs text-[#888780]">過去7日間</p>
                <p className="text-2xl font-medium">{views.last7d}</p>
              </div>
              <div className="rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="text-xs text-[#888780]">過去30日間</p>
                <p className="text-2xl font-medium">{views.last30d}</p>
              </div>
            </div>
            {views.topPaths.length > 0 && (
              <div className="mt-3 rounded-xl bg-[#F1EFE8] px-4 py-3">
                <p className="mb-2 text-sm font-medium">
                  人気ページ(過去30日間)
                </p>
                <div className="flex flex-col gap-1">
                  {views.topPaths.map(([path, count]) => (
                    <div
                      key={path}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-[#5F5E5A]">{path}</span>
                      <span className="shrink-0 pl-3 font-medium">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-6">
            <section>
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

            <section>
              <p className="mb-3 text-lg font-medium">
                ご報告・ご要望({reports.length}件)
              </p>
              {reports.length === 0 ? (
                <p className="text-sm text-[#888780]">まだありません。</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {reports.map((row) => (
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
