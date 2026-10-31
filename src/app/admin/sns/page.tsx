import { AdminTabNav } from "@/components/AdminTabNav";
import { XPostForm } from "@/components/XPostForm";
import { listPublishedArticles } from "@/lib/notion";

export const metadata = { title: "SNS管理 | ハハナビ管理画面" };

export default async function AdminSns() {
  const articles = await listPublishedArticles().catch(() => []);
  const hasXCredentials =
    !!process.env.X_API_KEY &&
    !!process.env.X_API_SECRET &&
    !!process.env.X_ACCESS_TOKEN &&
    !!process.env.X_ACCESS_SECRET;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-5 lg:px-8 lg:py-6">
      <AdminTabNav active="sns" />

      <section className="mb-8">
        <p className="mb-3 text-lg font-medium">X投稿</p>

        {!hasXCredentials && (
          <div className="mb-3 rounded-xl bg-[#FAECE7] px-4 py-3 text-sm text-[#712B13]">
            X
            APIの認証情報(X_API_KEY・X_API_SECRET・X_ACCESS_TOKEN・X_ACCESS_SECRET)がVercelにまだ設定されていません。投稿ボタンはこの設定が終わるまで使えません。
          </div>
        )}

        <XPostForm
          articles={articles.map((a) => ({ id: a.id, title: a.title }))}
        />
      </section>
    </div>
  );
}
