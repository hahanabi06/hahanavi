import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { QUALIFICATIONS } from "@/lib/qualifications";
import programsData from "@/data/programs.json";

export const metadata = { title: "おすすめ資格 | ハハナビ" };

// 資格取得そのものを後押ししてくれる国の制度(career/education カテゴリ)を
// あわせて案内する。programs.jsonが単一の情報源なので、ここでは絞り込むだけ
const SUPPORT_PROGRAMS = programsData.programs
  .filter((p) => p.category === "career" || p.category === "education")
  .map((p) => ({ id: p.id, name: p.name, headline: p.headline }));

export default function ShikakuPage() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <SiteLogoLink />
          <h1 className="mb-4 text-lg font-medium">おすすめ資格</h1>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <BearParentChild size={40} />
            <p className="font-heading text-base leading-relaxed">
              未経験からでも目指しやすくて、仕事につながりやすい資格をまとめたよ。
              資格取得を後押ししてくれる制度もあわせてチェックしてみてね。
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-2.5">
            {QUALIFICATIONS.map(({ icon: Icon, label, note, detail }) => (
              <div key={label} className="rounded-xl bg-[#F1EFE8] px-3.5 py-3">
                <div className="mb-1.5 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                    <Icon size={18} className="text-[#5F5E5A]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-[#888780]">{note}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[#5F5E5A]">{detail}</p>
              </div>
            ))}
          </div>

          <section>
            <p className="mb-2.5 text-base font-medium">資格取得を後押しする制度</p>
            <div className="flex flex-col gap-1.5">
              {SUPPORT_PROGRAMS.map((p) => (
                <Link
                  key={p.id}
                  href={`/seido/${p.id}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
                >
                  <p className="text-sm leading-snug">{p.name}</p>
                  <div className="flex shrink-0 items-center gap-1">
                    {p.headline && (
                      <span className="text-xs font-semibold whitespace-nowrap text-[#993C1D]">
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
