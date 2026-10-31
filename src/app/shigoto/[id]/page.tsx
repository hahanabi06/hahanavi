import { notFound } from "next/navigation";
import Link from "next/link";
import { IconChevronRight, IconStarFilled, IconStar } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { PageHeader } from "@/components/Breadcrumb";
import { ReportForm } from "@/components/ReportForm";
import { LineDiagnosisBar } from "@/components/LineDiagnosisCTA";
import {
  JOBS,
  type JobRatings,
  type JobRatingNotes,
  type JobFlexibilityByAge,
} from "@/lib/jobs";
import programsData from "@/data/programs.json";

const RATING_LABELS: { key: keyof JobRatings; label: string }[] = [
  { key: "income", label: "収入" },
  { key: "hireability", label: "就職しやすさ" },
  { key: "flexibility", label: "働き方の柔軟性" },
  { key: "stability", label: "将来性・安定性" },
];

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex shrink-0 gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= score ? (
          <IconStarFilled key={i} size={14} className="text-[#D85A30]" />
        ) : (
          <IconStar key={i} size={14} className="text-[#D3D1C7]" />
        ),
      )}
    </div>
  );
}

function RatingList({
  ratings,
  notes,
  flexibilityByAge,
}: {
  ratings: JobRatings;
  notes: JobRatingNotes;
  flexibilityByAge?: JobFlexibilityByAge[];
}) {
  return (
    <div className="flex flex-col divide-y divide-[#E3E0D6] rounded-2xl bg-[#F1EFE8] px-3.5">
      {RATING_LABELS.map(({ key, label }) => {
        if (key === "flexibility" && flexibilityByAge && flexibilityByAge.length > 0) {
          return (
            <div key={key} className="py-3">
              <p className="text-body mb-2 font-medium">{label}</p>
              <div className="flex flex-col gap-2.5">
                {flexibilityByAge.map((item, i) => (
                  <div
                    key={item.ageGroup}
                    className={i > 0 ? "border-t border-[#E3E0D6] pt-2.5" : ""}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-caption font-medium text-[#5F5E5A]">
                        {item.ageGroup}
                      </span>
                      <StarRow score={item.score} />
                    </div>
                    <p className="text-caption leading-relaxed text-[#5F5E5A]">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="py-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-body font-medium">{label}</span>
              <StarRow score={ratings[key]} />
            </div>
            <p className="text-caption leading-relaxed text-[#5F5E5A]">
              {notes[key]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

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

  const incomeMid = job.incomeRange
    ? (job.incomeRange.min + job.incomeRange.max) / 2
    : 0;
  const incomeScaleMax = job.incomeCompare
    ? Math.max(incomeMid, job.incomeCompare.amount) * 1.05
    : 0;

  // 柔軟性は年齢別に分かれている場合、その平均を使って5軸の総合点を出す
  const overallRating = job.ratings
    ? (() => {
        const flexScore =
          job.flexibilityByAge && job.flexibilityByAge.length > 0
            ? job.flexibilityByAge.reduce((sum, item) => sum + item.score, 0) /
              job.flexibilityByAge.length
            : job.ratings.flexibility;
        const scores = [
          job.ratings.income,
          job.ratings.hireability,
          flexScore,
          job.ratings.stability,
        ];
        return (
          Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        );
      })()
    : null;

  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <PageHeader
            items={[
              { label: "お仕事一覧", href: "/shigoto" },
              { label: job.title },
            ]}
          />

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

          <div className="mb-3 flex items-center justify-between gap-2">
            <h1 className="text-heading-title">{job.title}</h1>
            {overallRating !== null && (
              <div className="flex shrink-0 items-center gap-1">
                <StarRow score={Math.round(overallRating)} />
                <span className="text-body font-semibold text-[#D85A30]">
                  {overallRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <BearParentChild size={40} />
            <p className="font-heading text-body leading-relaxed">
              {job.detail}
            </p>
          </div>

          {job.licenseType && (
            <div className="mb-5 rounded-xl bg-[#E6F1FB] px-3.5 py-3">
              <p className="text-body font-semibold text-[#0C447C]">
                {job.licenseType}
              </p>
              {job.licenseNote && (
                <p className="text-caption mt-1 leading-relaxed text-[#0C447C]">
                  {job.licenseNote}
                </p>
              )}
            </div>
          )}

          <section className="mb-6">
            <p className="text-heading-section mb-2">どんなお仕事？</p>
            <p className="text-body leading-relaxed text-[#5F5E5A]">
              {job.overview}
            </p>
          </section>

          <section className="mb-6">
            <dt className="text-heading-section mb-2">年収の目安</dt>
            <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3">
              {job.incomeRange && job.incomeCompare ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-caption font-medium text-[#712B13]">
                        {job.title}
                      </span>
                      <span className="text-body font-semibold text-[#712B13]">
                        約{job.incomeRange.min}〜{job.incomeRange.max}万円
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-[#D85A30]"
                        style={{
                          width: `${(incomeMid / incomeScaleMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-caption text-[#8A7A6A]">
                        {job.incomeCompare.label}
                      </span>
                      <span className="text-caption font-medium text-[#8A7A6A]">
                        {job.incomeCompare.amount}万円
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-[#C9B9A8]"
                        style={{
                          width: `${(job.incomeCompare.amount / incomeScaleMax) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] leading-tight text-[#A89B86]">
                    出典: 厚労省「令和3年度全国ひとり親世帯等調査」(母の平均年間就労収入)
                  </p>
                </div>
              ) : (
                <p className="text-body font-semibold text-[#712B13]">
                  {job.income}
                </p>
              )}
            </dd>
            {job.incomeNote && (
              <p className="text-caption mt-1.5 text-[#888780]">
                {job.incomeNote}
              </p>
            )}
          </section>

          {job.ratings && job.ratingNotes && (
            <section className="mb-2">
              <p className="text-heading-section mb-2.5">お仕事評価</p>
              <RatingList
                ratings={job.ratings}
                notes={job.ratingNotes}
                flexibilityByAge={job.flexibilityByAge}
              />
            </section>
          )}

          <p className="text-caption mb-6 leading-relaxed text-[#888780]">
            年収・求人動向は2026年10月時点で調べた目安です。実際の条件は求人ごとに確認してね。
          </p>

          {!job.ratings && (
            <section className="mb-6">
              <dt className="text-label mb-1 text-[#5F5E5A]">就職難易度</dt>
              <dd className="text-body leading-relaxed">{job.demand}</dd>
            </section>
          )}

          {job.routes ? (
            <section className="mb-6">
              <dt className="text-heading-section mb-2">関連資格</dt>
              <dd className="flex flex-col divide-y divide-[#E3E0D6] rounded-2xl bg-[#F1EFE8] px-3.5">
                <div className="flex items-center justify-between gap-2 py-3">
                  <p className="text-body font-semibold">{job.title}</p>
                  {job.examPassRate && (
                    <div className="shrink-0 text-right">
                      <p className="text-lg leading-tight font-bold text-[#D85A30]">
                        {job.examPassRate.rate}
                      </p>
                      <p className="text-[10px] leading-tight text-[#888780]">
                        {job.examPassRate.note}
                      </p>
                    </div>
                  )}
                </div>

                {job.licenseBenefits && job.licenseBenefits.length > 0 && (
                  <div className="py-3">
                    <p className="text-label mb-1.5 text-[#5F5E5A]">
                      取ると良いこと
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.licenseBenefits.map((text) => (
                        <span
                          key={text}
                          className="text-caption inline-block rounded-full bg-[#FFF6DC] px-3 py-1 font-medium text-[#8A6A1A]"
                        >
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="py-3">
                  <p className="text-label mb-1.5 text-[#5F5E5A]">取得ルート</p>
                  <div className="flex flex-col gap-3">
                    {job.routes.map((route, i) => (
                      <div key={route.label} className="flex gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D85A30] text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-body mb-1 font-semibold text-[#5F5E5A]">
                            {route.label}
                          </p>
                          <p className="text-caption leading-relaxed text-[#5F5E5A]">
                            {route.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </dd>
            </section>
          ) : (
            <section className="mb-6">
              <dt className="text-label mb-1 text-[#5F5E5A]">
                資格の取得期間
              </dt>
              <dd className="text-body leading-relaxed">{job.period}</dd>
            </section>
          )}

          {SUPPORT_PROGRAMS.length > 0 && (
            <section className="mb-6">
              <p className="text-heading-section mb-2.5">利用できる制度</p>
              <div className="flex flex-col divide-y divide-[#E3E0D6] rounded-2xl bg-[#F1EFE8] px-3.5">
                {SUPPORT_PROGRAMS.map((p) => (
                  <Link
                    key={p.id}
                    href={`/seido/${p.id}`}
                    className="flex items-center justify-between gap-2.5 py-3"
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

          <div className="mb-4 border-b border-[#D3D1C7]">
            <ReportForm programId={job.id} programName={job.title} source="job" />
          </div>

          <LineDiagnosisBar />
        </main>
      </div>
    </>
  );
}
