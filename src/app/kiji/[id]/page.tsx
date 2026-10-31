import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { IconChevronRight, IconExternalLink } from "@tabler/icons-react";
import { BearMama, BearCub, BearConsultant } from "@/components/Bear";
import { PageHeader } from "@/components/Breadcrumb";
import { ViewTracker } from "@/components/ViewTracker";
import { ReportForm } from "@/components/ReportForm";
import { LineDiagnosisBar } from "@/components/LineDiagnosisCTA";
import { getArticle, listPublishedArticles, type ArticleBlock } from "@/lib/notion";

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
        <PageHeader
          items={[
            { label: "お役立ち記事", href: "/kiji" },
            { label: article.title },
          ]}
        />

        {!article.published && (
          <div className="text-body mb-4 rounded-xl bg-[#FCEAEA] px-3.5 py-2 font-bold text-[#C0392B]">
            プレビュー中(まだ下書き、公開はされていません)
          </div>
        )}

        <h1 className="text-heading-title mb-1 leading-snug">{article.title}</h1>
        <p className="text-caption mb-5 text-[#888780]">
          {formatArticleDate(article.createdTime)}公開
          {formatArticleDate(article.lastEditedTime) !==
            formatArticleDate(article.createdTime) &&
            `(${formatArticleDate(article.lastEditedTime)}更新)`}
        </p>

        <div className="mb-5 flex flex-col gap-3">
          {article.blocks.map((block, i) => {
            const prevBlock = article.blocks[i - 1];
            // 区切り線は「本当に新しいセクションが始まる場所」(見出しの前)だけに出す。
            // 出典・参考の段落は会話や直前の文章の一部として扱うので線は入れない
            const divider = block.type === "heading" && prevBlock && (
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
                      className={`font-heading text-body relative w-[260px] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-line after:absolute after:top-3 after:h-0 after:w-0 after:border-y-[6px] after:border-y-transparent ${
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
                  <p className="text-body font-medium">{block.text}</p>
                </div>
              );
            }
            if (block.type === "banner") {
              return (
                <div key={i} className="contents">
                  {divider}
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 overflow-hidden rounded-xl bg-[#F1EFE8] px-3.5 py-3"
                  >
                    {block.image && (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white p-1">
                        <Image
                          src={block.image}
                          alt=""
                          width={60}
                          height={60}
                          className="h-auto max-h-full w-auto max-w-full"
                        />
                      </div>
                    )}
                    <p className="text-body flex-1 leading-snug">{block.text}</p>
                    <IconExternalLink size={16} className="shrink-0 text-[#888780]" />
                  </a>
                </div>
              );
            }
            if (block.type === "bullet") {
              return (
                <div key={i} className="contents">
                  {divider}
                  <div className="text-body flex gap-1.5 pl-1 leading-relaxed">
                    <span className="shrink-0">・</span>
                    <span className="whitespace-pre-line">{block.text}</span>
                  </div>
                </div>
              );
            }
            // 出典・参考が連続するときは、間のすき間を詰めて1つのリストのように見せる
            const isCitation = (b?: ArticleBlock) => b?.type === "paragraph" && !!b.url;
            const prevIsCitation = isCitation(prevBlock);
            const nextIsCitation = isCitation(article.blocks[i + 1]);

            return (
              <div key={i} className="contents">
                {divider}
                {block.url ? (
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-caption block text-[#888780] underline ${prevIsCitation ? "-mt-2" : "mt-1"} ${nextIsCitation ? "mb-0" : "mb-3"}`}
                  >
                    {block.text}
                  </a>
                ) : (
                  <p className="text-body leading-relaxed whitespace-pre-line">
                    {block.text}
                  </p>
                )}
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
                  className="text-caption text-[#888780] underline"
                >
                  出典: {p.name}(公式ページ)
                </a>
              ))}
          </div>
        )}

        {article.relatedPrograms.length > 0 && (
          <div className="mb-5">
            <hr className="mb-5 border-t border-[#D3D1C7]" />
            <p className="text-heading-section mb-2">
              申請条件・窓口など、詳しくはこちら
            </p>
            <div className="flex flex-col gap-1.5">
              {article.relatedPrograms.map((program) => (
                <Link
                  key={program.id}
                  href={`/seido/${program.id}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
                >
                  <p className="text-body leading-snug">{program.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {program.headline && (
                      <span className="text-caption font-semibold whitespace-nowrap text-[#993C1D]">
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

        <hr className="mb-4 border-t border-[#D3D1C7]" />
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
