import { notFound } from "next/navigation";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { LineDiagnosisBar } from "@/components/LineDiagnosisCTA";
import { JOBS } from "@/lib/jobs";
import programsData from "@/data/programs.json";

// career/educationカテゴリには「親自身の資格取得支援」と「子どもの進学費用の奨学金」が
// 混在しているため、ここでは前者(資格取得そのものを後押しする制度)だけに絞る
const JOB_SUPPORT_PROGRAM_IDS = [
  "koutou-shokugyou-kunren", // 高等職業訓練促進給付金
  "jiritsu-shien-kyouiku-kunren", // 自立支援教育訓練給付金
];
const SUPPORT_PROGRAMS = programsData.programs
  .filter((p) => JOB_SUPPORT_PROGRAM_IDS.includes(p.id))
  .map((p) => ({ id: p.id, name: p.name, headline: p.headline }));

export function generateStaticParams() {
  return JOBS.map((j) => ({ id: j.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id);
  return { title: job ? `${job.title} | ハハナビ` : "おすすめのお仕事 | ハハナビ" };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id);
  if (!job) return notFound();

  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <SiteLogoLink />

          <div className="mb-2 flex flex-wrap gap-1.5">
            {job.badges.map((badge) => (
              <span
                key={badge}
                className="text-caption inline-block w-fit rounded-full bg-[#E9F3EA] px-3 py-1 font-medium text-[#1F7A3D]"
              >
                {badge}
              </span>
            ))}
          </div>

          <h1 className="text-heading-title mb-3">{job.title}</h1>

          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <BearParentChild size={40} />
            <p className="font-heading text-body leading-relaxed">
              {job.detail}
            </p>
          </div>

          <div className="mb-1 flex flex-col gap-0">
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-2 text-[#5F5E5A]">年収の目安</dt>
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3">
                <p className="text-body font-semibold text-[#712B13]">
                  {job.income}
                </p>
              </dd>
            </div>

            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-1 text-[#5F5E5A]">求人の状況</dt>
              <dd className="text-body leading-relaxed">{job.demand}</dd>
            </div>

            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-1 text-[#5F5E5A]">資格の取得期間</dt>
              <dd className="text-body leading-relaxed">{job.period}</dd>
            </div>
          </div>

          <p className="text-caption mt-3 mb-5 leading-relaxed text-[#888780]">
            年収・求人動向は2026年10月時点で調べた目安です。実際の条件は求人ごとに確認してね。
          </p>

          {SUPPORT_PROGRAMS.length > 0 && (
            <section className="mb-6">
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
          )}

          <Link
            href="/shigoto"
            className="mb-5 flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
          >
            <p className="text-body leading-snug">他のお仕事も見てみる</p>
            <IconChevronRight size={16} className="text-[#888780]" />
          </Link>

          <LineDiagnosisBar />
        </main>
      </div>
    </>
  );
}
