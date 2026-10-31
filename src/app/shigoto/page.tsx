import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { JOBS } from "@/lib/jobs";
import programsData from "@/data/programs.json";

export const metadata = { title: "おすすめの仕事 | ハハナビ" };

// 資格取得そのものを後押ししてくれる国の制度(career/education カテゴリ)を
// あわせて案内する。programs.jsonが単一の情報源なので、ここでは絞り込むだけ
const SUPPORT_PROGRAMS = programsData.programs
  .filter((p) => p.category === "career" || p.category === "education")
  .map((p) => ({ id: p.id, name: p.name, headline: p.headline }));

export default function ShigotoPage() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <SiteLogoLink />
          <h1 className="text-heading-title mb-4">おすすめの仕事</h1>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <BearParentChild size={40} />
            <p className="font-heading text-body leading-relaxed">
              「今より収入を増やしたいけど、何から始めたらいいか分からない…」そんな人のために、求人の多さや年収を調べて、現実的に目指しやすい仕事をまとめたよ。
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-2.5">
            {JOBS.map(
              ({
                icon: Icon,
                title,
                qualification,
                income,
                demand,
                period,
                badges,
                detail,
              }) => (
                <div key={title} className="rounded-xl bg-[#F1EFE8] px-3.5 py-3">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                      <Icon size={18} className="text-[#5F5E5A]" />
                    </div>
                    <div>
                      <p className="text-heading-section">{title}</p>
                      <p className="text-caption text-[#888780]">
                        必要な資格: {qualification}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2 rounded-lg bg-[#FAECE7] px-3 py-2">
                    <p className="text-body font-semibold text-[#712B13]">
                      {income}
                    </p>
                    <p className="text-caption text-[#993C1D]">{demand}</p>
                  </div>

                  <p className="text-body mb-2 leading-relaxed text-[#5F5E5A]">
                    {detail}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-caption rounded-full bg-white px-2 py-0.5 text-[#5F5E5A]">
                      取得期間: {period}
                    </span>
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="text-caption rounded-full bg-[#E9F3EA] px-2 py-0.5 font-medium text-[#1F7A3D]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <section>
            <p className="text-heading-section mb-2.5">
              収入アップを後押しする制度
            </p>
            <div className="flex flex-col gap-1.5">
              {SUPPORT_PROGRAMS.map((p) => (
                <Link
                  key={p.id}
                  href={`/seido/${p.id}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
                >
                  <p className="text-body leading-snug">{p.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {p.headline && (
                      <span className="text-caption font-semibold whitespace-nowrap text-[#993C1D]">
                        {p.headline}
                      </span>
                    )}
                    <IconChevronRight size={16} className="text-[#888780]" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
