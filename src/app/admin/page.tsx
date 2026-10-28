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
    label: "Vercel(アクセス解析・デプロイ状況)",
    href: "https://vercel.com/hahanabi/hahanavi/analytics",
  },
  { label: "Supabase(データベース)", href: "https://supabase.com/dashboard/project/uayduadzycdptwmhoaqj" },
  {
    label: "Notion(記事の編集)",
    href: "https://www.notion.so/407d711ec25a80c5a4aedc433cb805b0",
  },
  { label: "LINE公式アカウント管理画面", href: "https://manager.line.biz/" },
  { label: "Gmail", href: "https://mail.google.com/mail/" },
  { label: "X(旧Twitter)", href: "https://x.com/home" },
];

export default async function AdminDashboard() {
  const supabase = getSupabaseServerClient();

  const [inquiriesRes, reportsRes] = await Promise.all([
    supabase
      .from("company_inquiries")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("program_reports")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const inquiries = inquiriesRes.data ?? [];
  const reports = reportsRes.data ?? [];

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xl font-medium">管理画面</p>
          <AdminLogoutButton />
        </div>

        <section className="mb-8">
          <p className="mb-3 text-lg font-medium">ポータル</p>
          <div className="grid grid-cols-2 gap-2">
            {PORTAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#F1EFE8] px-3.5 py-3 text-sm leading-snug"
              >
                {link.label}
              </a>
            ))}
          </div>
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
                    <p className="mt-1 whitespace-pre-wrap">{row.message}</p>
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
                  <p className="mt-1 whitespace-pre-wrap">{row.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
