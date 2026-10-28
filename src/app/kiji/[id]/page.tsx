import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { getArticle } from "@/lib/notion";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

export const instant = false;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id).catch(() => null);

  if (!article || !article.published) return notFound();

  return (
    <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 py-5">
        <div className="mb-4">
          <Link href="/kiji" aria-label="記事一覧へ戻る" className="mb-2 inline-block">
            <IconArrowLeft size={20} className="text-[#5F5E5A]" />
          </Link>
        </div>

        <h1 className="mb-5 text-lg leading-snug font-medium">{article.title}</h1>

        <div className="mb-5 flex flex-col gap-3">
          {article.blocks.map((block, i) => {
            if (block.type === "bear") {
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3"
                >
                  <BearParentChild size={40} />
                  <p className="text-sm leading-relaxed">{block.text}</p>
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

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
          <BearParentChild size={44} />
          <p className="text-sm leading-relaxed">
            自分の場合いくらになるか、LINEで聞いてみて
          </p>
        </div>

        <a
          href={LINE_ADD_FRIEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: LINE_GREEN }}
        >
          <IconMessageCircle2 size={16} />
          LINEで簡単手当診断
        </a>
      </main>
    </div>
  );
}
