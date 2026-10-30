import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Link from "next/link";
import { IconMessageCircle2, IconChevronRight } from "@tabler/icons-react";
import { BearMama, BearCub } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { ViewTracker } from "@/components/ViewTracker";
import { getArticle, listPublishedArticles } from "@/lib/notion";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

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

        <h1 className="mb-5 text-lg leading-snug font-medium">{article.title}</h1>

        <div className="mb-5 flex flex-col gap-3">
          {article.blocks.map((block, i) => {
            const prevBlock = article.blocks[i - 1];
            const divider = prevBlock?.type === "bear" && block.type !== "bear" && (
              <hr key={`divider-${i}`} className="my-2 border-t border-[#D3D1C7]" />
            );

            if (block.type === "bear") {
              const isKid = block.speaker === "kid";
              return (
                <div
                  key={i}
                  className={`flex w-full ${isKid ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`flex items-start gap-2 ${isKid ? "flex-row" : "flex-row-reverse"}`}
                  >
                    {isKid ? <BearCub size={26} /> : <BearMama size={44} />}
                    <p
                      className={`relative w-[220px] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line after:absolute after:top-3 after:h-0 after:w-0 after:border-y-[6px] after:border-y-transparent ${
                        isKid
                          ? "bg-[#F1EFE8] after:-left-2 after:border-r-[8px] after:border-r-[#F1EFE8]"
                          : "bg-[#FAECE7] after:-right-2 after:border-l-[8px] after:border-l-[#FAECE7]"
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

        {article.relatedPrograms.length > 0 && (
          <div className="mb-5">
            <hr className="mt-1 mb-5 border-t border-[#D3D1C7]" />
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

        <div className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-4">
          <p className="mb-2.5 text-sm leading-relaxed">
            この記事の制度、自分は対象になる?
            <br />
            他の制度と合わせていくらもらえるか診断するよ
          </p>
          <a
            href={LINE_ADD_FRIEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: LINE_GREEN }}
          >
            <IconMessageCircle2 size={16} />
            LINEで簡単手当診断をしてみる
          </a>
        </div>
      </main>
      </div>
    </>
  );
}
