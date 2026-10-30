import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { listPublishedArticles } from "@/lib/notion";
import { ArticleEyecatch } from "@/lib/article-category";
import { LineDiagnosisBar } from "@/components/LineDiagnosisCTA";

export default async function KijiListPage() {
  const articles = await listPublishedArticles().catch(() => []);

  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <SiteLogoLink />
        <h1 className="mb-4 text-lg font-medium">お役立ち記事</h1>
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={40} />
          <p className="text-sm leading-relaxed">
            知っておくと得する話を、少しずつ増やしていくね。
          </p>
        </div>

        {articles.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/kiji/${a.id}`}
                className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3 py-2"
              >
                <ArticleEyecatch category={a.category} size={48} />
                <p className="flex-1 text-sm leading-snug">{a.title}</p>
                <IconChevronRight size={16} className="shrink-0 text-[#888780]" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#F1EFE8] px-3.5 py-4 text-xs leading-relaxed text-[#888780]">
            まだ記事がありません。準備中です。
          </div>
        )}

        <LineDiagnosisBar className="mt-5" />
      </main>
      </div>
    </>
  );
}
