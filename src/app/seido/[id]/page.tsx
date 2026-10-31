import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IconChevronRight,
  IconAlertTriangle,
  IconBuildingBank,
} from "@tabler/icons-react";
import { BearParentChild, BearCub } from "@/components/Bear";
import { PageHeader } from "@/components/Breadcrumb";
import { ReportForm } from "@/components/ReportForm";
import { LineDiagnosisBar } from "@/components/LineDiagnosisCTA";
import programsData from "@/data/programs.json";

// 長い金額の説明文を、意味の切れ目(句点・スラッシュ)で改行して読みやすくする
function formatAmountLines(text: string): string[] {
  return text
    .split("。")
    .filter(Boolean)
    .flatMap((sentence) => sentence.split(" / ").filter(Boolean));
}

// 必要書類の説明文を、読点(、)・句点(。)区切りで箇条書きにする
// (このデータは一貫して「書類、書類、書類」の列挙形式で書かれているため)
function splitDocItems(text: string): string[] {
  return text
    .split(/[、。]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ByChildrenRow = {
  children: number;
  full: number;
  partialMin?: number;
  partialMax?: number;
};

type ByChildren = {
  note?: string;
  rows: ByChildrenRow[];
  extraPerChild: { full: number; partialMin?: number; partialMax?: number };
};

type WardPattern = {
  label: string;
  limits: string;
  wards: string[];
};

type IncomeTierRow = {
  label: string; // 例: "扶養0人"
  value?: string; // 単一のしきい値(全部/一部の区別がない制度用)
  full?: string; // 全部支給のしきい値
  partial?: string; // 一部支給のしきい値
};

type IncomeTiers = {
  note?: string; // 例: "令和8年度"
  rows: IncomeTierRow[];
  footnote?: string; // 例: "以降1人ごとに加算"
};

type Tier = {
  label: string;
  value: string;
  note?: string;
};

type Exception = {
  area: string;
  description: string;
  note?: string;
  source?: string;
};

type ExampleSource = {
  area: string;
  url: string;
};

type Program = {
  id: string;
  name: string;
  headline?: string;
  layer:
    | "national"
    | "national_prefecture_admin"
    | "prefecture"
    | "municipal"
    | "prefecture_municipal";
  prefecture?: string;
  areaBadgeOverride?: string;
  category: string;
  amount: string;
  byChildren?: ByChildren;
  tiers?: Tier[];
  tiersNote?: string; // tiers一覧の上に出す前置き説明(例: 「世帯区分により年額が異なる」)
  incomeLimit?: string;
  incomeTiers?: IncomeTiers;
  wardPatterns?: WardPattern[];
  incomeLimitNote?: string;
  eligibility?: string;
  requiredDocs?: string;
  window: string;
  kumaNote?: string;
  verifyNeeded: boolean;
  source?: string;
  verifiedAt?: string;
  note?: string;
  exceptions?: Exception[];
  exampleSource?: ExampleSource;
  wardsAvailable?: "all" | string[];
  hitorioyaOnly?: boolean; // 未指定(true扱い)ならひとり親限定、falseなら子育て世帯全般が対象
};

const programs = programsData.programs as Program[];

export const instant = false;

const AREA_BADGE: Record<Program["layer"], string> = {
  national: "全国",
  national_prefecture_admin: "全国",
  prefecture: "東京都",
  municipal: "台東区",
  prefecture_municipal: "東京都・台東区",
};

// prefectureフィールドがある場合はそれを優先(都道府県が増えてきたため、
// 「prefecture層=東京都」決め打ちのAREA_BADGEだけだと他県の制度を誤表示してしまう)
function areaBadgeFor(program: Program): string {
  if (program.areaBadgeOverride) return program.areaBadgeOverride;
  if (program.prefecture) return program.prefecture;
  if (program.layer === "municipal" && Array.isArray(program.wardsAvailable)) {
    return program.wardsAvailable.join("・");
  }
  return AREA_BADGE[program.layer];
}

const CATEGORY_LABEL: Record<string, string> = {
  cash: "現金給付",
  medical: "医療費の助成",
  childcare: "保育料の助成",
  career: "資格・就労支援",
  tax: "税金の控除",
  insurance: "保険料の軽減",
  housing: "住まいの支援",
  education: "教育費の支援",
  discount: "割引・優遇制度",
  loan: "貸付制度(要返済)",
};

export function generateStaticParams() {
  return programs.map((p) => ({ id: p.id }));
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = programs.find((p) => p.id === id);
  if (!program) return notFound();

  // 都道府県・市区町村限定の制度は、関連制度も同じエリアのものを優先して出す
  // (例: 大阪府の制度の関連に東京都の制度を出すと混乱するため)
  const otherPrograms = programs.filter((p) => p.id !== program.id);
  const sameAreaFirst = program.prefecture
    ? [...otherPrograms].sort((a, b) => {
        const aMatch = a.prefecture === program.prefecture ? 0 : 1;
        const bMatch = b.prefecture === program.prefecture ? 0 : 1;
        return aMatch - bMatch;
      })
    : otherPrograms;
  const related = sameAreaFirst.slice(0, 2);

  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <PageHeader
          items={[
            { label: "お金の支援制度", href: "/seido" },
            { label: program.name },
          ]}
        />
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="text-caption inline-block w-fit rounded-full bg-[#F1EFE8] px-3 py-1 font-medium text-[#5F5E5A]">
            {CATEGORY_LABEL[program.category] ?? program.category}
          </span>
          <span className="text-caption inline-block w-fit rounded-full bg-[#E6F1FB] px-3 py-1 font-medium text-[#0C447C]">
            もらえるエリア: {areaBadgeFor(program)}
          </span>
          {program.hitorioyaOnly === false && (
            <span className="text-caption inline-block w-fit rounded-full bg-[#E9F3EA] px-3 py-1 font-medium text-[#1F7A3D]">
              子持ち全員が対象
            </span>
          )}
        </div>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-heading-title leading-snug">{program.name}</h1>
          {program.headline && (
            <span className="text-body font-semibold text-[#993C1D]">
              {program.headline}
            </span>
          )}
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={40} />
          <p className="font-heading text-body leading-relaxed">
            {program.kumaNote ??
              "むずかしい言葉が多いけど、分からなかったらLINEで聞いてね。かみ砕いて説明するよ。"}
          </p>
        </div>

        <div className="mb-1 flex flex-col gap-0">
          {program.eligibility && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-1.5 text-[#5F5E5A]">対象者</dt>
              <dd className="text-body rounded-xl bg-[#F1EFE8] px-3.5 py-3 leading-relaxed">
                {program.eligibility}
              </dd>
            </div>
          )}
          {program.wardPatterns && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-2 text-[#5F5E5A]">
                所得基準(お住まいの区で2パターン)
              </dt>
              <dd className="flex flex-col gap-2.5">
                {program.wardPatterns.map((pattern) => (
                  <div
                    key={pattern.label}
                    className="rounded-xl bg-[#FAECE7] px-3.5 py-3"
                  >
                    <p className="text-caption mb-1.5 font-semibold text-[#993C1D]">
                      {pattern.label}
                    </p>
                    <p className="text-body mb-2.5 leading-snug font-medium text-[#712B13]">
                      {pattern.limits}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pattern.wards.map((ward) => (
                        <span
                          key={ward}
                          className="text-caption rounded-full bg-white px-2 py-0.5 text-[#712B13]"
                        >
                          {ward}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {program.incomeLimitNote && (
                  <p className="text-caption leading-relaxed text-[#888780]">
                    {program.incomeLimitNote}
                  </p>
                )}
              </dd>
            </div>
          )}
          {!program.wardPatterns && program.incomeTiers && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-2 text-[#5F5E5A]">所得基準</dt>
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3">
                {program.incomeTiers.note && (
                  <p className="text-caption mb-2 text-[#993C1D]">
                    {program.incomeTiers.note}
                  </p>
                )}
                <div className="flex flex-col gap-1.5">
                  {program.incomeTiers.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/60 px-2.5 py-1.5"
                    >
                      <span className="text-caption shrink-0 text-[#5F5E5A]">
                        {row.label}
                      </span>
                      <span className="text-body text-right font-medium text-[#712B13]">
                        {row.value ??
                          (row.full && row.partial
                            ? `全部${row.full} / 一部${row.partial}`
                            : (row.full ?? row.partial))}
                      </span>
                    </div>
                  ))}
                </div>
                {program.incomeTiers.footnote && (
                  <p className="text-caption mt-2 leading-relaxed text-[#993C1D]">
                    {program.incomeTiers.footnote}
                  </p>
                )}
              </dd>
            </div>
          )}
          {!program.wardPatterns && !program.incomeTiers && program.incomeLimit && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-2 text-[#5F5E5A]">所得基準</dt>
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3 text-left">
                {formatAmountLines(program.incomeLimit).map((line, i) => (
                  <p
                    key={i}
                    className="text-body leading-snug font-medium text-[#712B13]"
                  >
                    {line}
                  </p>
                ))}
              </dd>
            </div>
          )}

          {/* もらえる金額・助成内容: 淡い色の箱、左揃え、数字を強調 */}
          <div className="border-b border-[#D3D1C7] py-3">
            <dt className="text-label mb-2 text-[#5F5E5A]">
              もらえる金額・助成内容
            </dt>
            {program.byChildren ? (
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3">
                {program.byChildren.note && (
                  <p className="text-caption mb-2.5 leading-relaxed text-[#993C1D]">
                    {program.byChildren.note}
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {program.byChildren.rows.map((row) => (
                    <div
                      key={row.children}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: row.children }).map((_, i) => (
                            <BearCub key={i} size={18} />
                          ))}
                        </div>
                        <span className="text-caption text-[#5F5E5A]">
                          子ども{row.children}人
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-body leading-snug font-semibold text-[#712B13]">
                          {row.full.toLocaleString()}円
                        </p>
                        {row.partialMin !== undefined && (
                          <p className="text-caption text-[#993C1D]">
                            一部支給 {row.partialMin.toLocaleString()}〜
                            {row.partialMax?.toLocaleString()}円
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-caption mt-2.5 leading-relaxed text-[#993C1D]">
                  それ以降は子ども1人につき+
                  {program.byChildren.extraPerChild.full.toLocaleString()}円
                  {program.byChildren.extraPerChild.partialMin !== undefined &&
                    `(一部支給は+${program.byChildren.extraPerChild.partialMin.toLocaleString()}〜${program.byChildren.extraPerChild.partialMax?.toLocaleString()}円)`}
                </p>
              </dd>
            ) : program.tiers ? (
              <dd className="flex flex-col gap-2">
                {program.tiersNote && (
                  <p className="text-caption text-[#993C1D]">
                    {program.tiersNote}
                  </p>
                )}
                {program.tiers.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-xl bg-[#FAECE7] px-3.5 py-3"
                  >
                    <p className="text-caption mb-1 font-semibold text-[#993C1D]">
                      {tier.label}
                    </p>
                    <p className="text-body leading-snug font-semibold text-[#712B13]">
                      {tier.value}
                    </p>
                    {tier.note && (
                      <p className="text-caption mt-1 leading-relaxed text-[#993C1D]">
                        {tier.note}
                      </p>
                    )}
                  </div>
                ))}
              </dd>
            ) : (
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3 text-left">
                {formatAmountLines(program.amount).map((line, i) => (
                  <p
                    key={i}
                    className="text-body leading-snug font-medium text-[#712B13]"
                  >
                    {line}
                  </p>
                ))}
              </dd>
            )}
          </div>

          {program.exceptions && program.exceptions.length > 0 && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-2 text-[#5F5E5A]">
                さらに上乗せがある市区町村
              </dt>
              <dd className="flex flex-col gap-2">
                {program.exceptions.map((exception, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#EAF7EE] px-3.5 py-3"
                  >
                    <span className="text-caption mb-1.5 inline-block rounded-full bg-white px-2 py-0.5 font-semibold text-[#1F7A3D]">
                      {exception.area}だけの上乗せ
                    </span>
                    <p className="text-body leading-snug font-semibold text-[#1F7A3D]">
                      {exception.description}
                    </p>
                    {exception.note && (
                      <p className="text-caption mt-1.5 leading-relaxed text-[#3C8C57]">
                        {exception.note}
                      </p>
                    )}
                    {exception.source && (
                      <a
                        href={exception.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-caption mt-1.5 inline-block text-[#1F7A3D] underline"
                      >
                        {exception.area}の条例・公式ページで確認する
                      </a>
                    )}
                  </div>
                ))}
              </dd>
            </div>
          )}

          {program.requiredDocs && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="text-label mb-1 text-[#5F5E5A]">必要書類</dt>
              <dd>
                <ul className="flex flex-col gap-1">
                  {splitDocItems(program.requiredDocs).map((item, i) => (
                    <li
                      key={i}
                      className="text-body flex gap-1.5 leading-relaxed"
                    >
                      <span className="shrink-0 text-[#993C1D]">・</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          <div className="border-b border-[#D3D1C7] py-3">
            <dt className="text-label mb-1.5 text-[#5F5E5A]">申請窓口</dt>
            <dd className="flex items-start gap-2 rounded-xl bg-[#F1EFE8] px-3.5 py-3">
              <IconBuildingBank
                size={16}
                className="mt-0.5 shrink-0 text-[#5F5E5A]"
              />
              <span className="text-body leading-relaxed">
                {program.window}
              </span>
            </dd>
          </div>

          {program.verifyNeeded && (
            <div className="mt-3 rounded-xl bg-[#FCEAEA] px-3.5 py-3">
              <p className="text-body flex items-center gap-1.5 font-bold text-[#C0392B]">
                <IconAlertTriangle size={16} className="shrink-0" />
                この制度の数字は現在確認中です。最新情報は窓口で確認してね。
              </p>
              {program.note && (
                <p className="text-caption mt-1.5 leading-relaxed text-[#8A4A4A]">
                  {program.note}
                </p>
              )}
            </div>
          )}
          {program.source && (
              <div className="py-3">
                <dt className="text-label mb-1 text-[#5F5E5A]">詳しくはこちら</dt>
                <dd className="text-body">
                  <a
                    href={program.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#185FA5] underline"
                  >
                    公式ページで確認する(最終確認 {program.verifiedAt})
                  </a>
                  {program.exampleSource && (
                    <>
                      <br />
                      <a
                        href={program.exampleSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#185FA5] underline"
                      >
                        {program.exampleSource.area}の案内ページ(具体的な金額の例)
                      </a>
                    </>
                  )}
                </dd>
              </div>
          )}
        </div>

        <p className="text-caption mb-1 leading-relaxed text-[#888780]">
          情報は目安です。正式な判定や最新の基準は窓口でご確認ください。
        </p>

        <div className="mb-4 border-b border-[#D3D1C7]">
          <ReportForm programId={program.id} programName={program.name} />
        </div>

        <p className="text-heading-section mb-2.5">関連する制度</p>
        <div className="mb-5 flex flex-col gap-1.5">
          {related.map((r) => (
            <Link
              key={r.id}
              href={`/seido/${r.id}`}
              className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-2.5"
            >
              <p className="text-body">{r.name}</p>
              <IconChevronRight size={16} className="text-[#888780]" />
            </Link>
          ))}
        </div>

        <LineDiagnosisBar className="mt-8" />
      </main>
      </div>
    </>
  );
}
