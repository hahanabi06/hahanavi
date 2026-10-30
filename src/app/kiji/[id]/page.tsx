import { notFound } from "next/navigation";
import { IconMessageCircle2 } from "@tabler/icons-react";
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

  if (!article || !article.published) return notFound();

  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <ViewTracker articleId={id} />
        <SiteLogoLink />

        <h1 className="mb-5 text-lg leading-snug font-medium">{article.title}</h1>

        <div className="mb-5 flex flex-col gap-3">
          {article.blocks.map((block, i) => {
            if (block.type === "bear") {
              const isKid = block.speaker === "kid";
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 ${isKid ? "flex-row" : "flex-row-reverse"}`}
                >
                  {isKid ? <BearCub size={32} /> : <BearMama size={36} />}
                  <p
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isKid ? "bg-[#F1EFE8]" : "bg-[#FAECE7]"
                    }`}
                  >
                    {block.text}
                  </p>
                </div>
              );
            }
            if (block.type === "heading") {
              return (
                <p key={i} className="text-base font-medium">
                  {block.text}
                </p>
              );
            }
            if (block.type === "bullet") {
              return (
                <p key={i} className="pl-4 text-sm leading-relaxed">
                  ・{block.text}
                </p>
              );
            }
            return (
              <p key={i} className="text-sm leading-relaxed">
                {block.text}
              </p>
            );
          })}
        </div>

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
