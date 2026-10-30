import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { BearMama, BearCub, BearConsultant } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { ViewTracker } from "@/components/ViewTracker";
import { ReportForm } from "@/components/ReportForm";
import { LineDiagnosisBar } from "@/components/LineDiagnosisCTA";
import { getArticle, listPublishedArticles } from "@/lib/notion";

function formatArticleDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export async function generateStaticParams() {
  const articles = await listPublishedArticles().catch(() => []);
  return articles.map((a) => ({ id: a.id }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id).catch(() => null);
  const { isEnabled: isPreview } = await draftMode();

  if (!article || (!article.published && !isPreview)) return notFound();

  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <ViewTracker articleId={id} />
        <SiteLogoLink />

        {!article.published && (
          <div className="mb-4 rounded-xl bg-[#FCEAEA] px-3.5 py-2 text-xs font-bold text-[#C0392B]">
            プレビュー中(まだ下書き、公開はされていません)
          </div>
        )}

        <h1 className="mb-1 text-lg leading-snug font-medium">{article.title}</h1>
        <p className="mb-5 text-xs text-[#888780]">
          {formatArticleDate(article.createdTime)}公開
          {formatArticleDate(article.lastEditedTime) !==
            formatArticleDate(article.createdTime) &&
            `(${formatArticleDate(article.lastEditedTime)}更新)`}
        </p>

        <div className="mb-5 flex flex-col gap-3">
          {article.blocks.map((block, i) => {
            const prevBlock = article.blocks[i - 1];
            const divider = prevBlock?.type === "bear" && block.type !== "bear" && (
              <hr key={`divider-${i}`} className="my-2 border-t border-[#D3D1C7]" />
            );

            if (block.type === "bear") {
              const isMama = block.speaker === "mama";
              const icon =
                block.speaker === "kid" ? (
                  <BearCub size={26} />
                ) : block.speaker === "consultant" ? (
                  <BearConsultant size={44} />
                ) : (
                  <BearMama size={44} />
                );
              return (
                <div
                  key={i}
                  className={`flex w-full ${isMama ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-start gap-2 ${isMama ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {icon}
                    <p
                      className={`relative w-[260px] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line after:absolute after:top-3 after:h-0 after:w-0 after:border-y-[6px] after:border-y-transparent ${
                        isMama
                          ? "bg-[#FAECE7] after:-right-2 after:border-l-[8px] after:border-l-[#FAECE7]"
                          : "bg-[#F1EFE8] after:-left-2 after:border-r-[8px] after:border-r-[#F1EFE8]"
                      }`}
                    >
                      {block.text}
                    </p>
                  </div>
                </div>
              );
            }
            if (block.type === "heading") {
              return (
                <div key={i} className="contents">
                  {divider}
                  <p className="text-base font-medium">{block.text}</p>
                </div>
              );
            }
            if (block.type === "bullet") {
              return (
                <div key={i} className="contents">
                  {divider}
                  <div className="flex gap-1.5 pl-1 text-sm leading-relaxed">
                    <span className="shrink-0">・</span>
                    <span className="whitespace-pre-line">{block.text}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="contents">
                {divider}
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {block.text}
                </p>
              </div>
            );
          })}
        </div>

        {article.relatedPrograms.some((p) => p.source) && (
          <div className="mb-5 flex flex-col gap-1">
            {article.relatedPrograms
              .filter((p) => p.source)
              .map((p) => (
                <a
                  key={p.id}
                  href={p.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#888780] underline"
                >
                  出典: {p.name}(公式ページ)
                </a>
              ))}
          </div>
        )}

        {article.relatedPrograms.length > 0 && (
          <div className="mb-5">
            <hr className="mb-5 border-t border-[#D3D1C7]" />
            <p className="mb-2 text-sm font-medium">
              申請条件・窓口など、詳しくはこちら
            </p>
            <div className="flex flex-col gap-1.5">
              {article.relatedPrograms.map((program) => (
                <Link
                  key={program.id}
                  href={`/seido/${program.id}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
                >
                  <p className="text-sm leading-snug">{program.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {program.headline && (
                      <span className="text-xs font-semibold whitespace-nowrap text-[#993C1D]">
                        {program.headline}
                      </span>
                    )}
                    <IconChevronRight size={16} className="text-[#888780]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 border-b border-[#D3D1C7]">
          <ReportForm
            programId={id}
            programName={article.title}
            source="article"
          />
        </div>

        <LineDiagnosisBar className="mt-8" />
      </main>
      </div>
    </>
  );
}
