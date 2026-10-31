import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { JOBS } from "@/lib/jobs";

export const metadata = { title: "おすすめのお仕事 | ハハナビ" };

export default function ShigotoListPage() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <SiteLogoLink />
          <h1 className="text-heading-title mb-4">おすすめのお仕事</h1>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <BearParentChild size={40} />
            <p className="font-heading text-body leading-relaxed">
              「今より収入を増やしたいけど、何から始めたらいいか分からない…」そんな人のために、求人の多さや年収を調べて、現実的に目指しやすい仕事をまとめたよ。
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {JOBS.map(({ id, icon: Icon, title, income, badges }) => (
              <Link
                key={id}
                href={`/shigoto/${id}`}
                className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                  <Icon size={18} className="text-[#5F5E5A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-heading-section">{title}</p>
                  <p className="text-caption text-[#888780]">{income}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
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
                <IconChevronRight size={16} className="shrink-0 text-[#888780]" />
              </Link>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
