import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconChevronRight,
  IconMessageCircle2,
} from "@tabler/icons-react";
import { BearParentChild, BearCub } from "@/components/Bear";
import programsData from "@/data/programs.json";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

// 長い金額の説明文を、意味の切れ目(句点・スラッシュ)で改行して読みやすくする
function formatAmountLines(text: string): string[] {
  return text
    .split("。")
    .filter(Boolean)
    .flatMap((sentence) => sentence.split(" / ").filter(Boolean));
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

type Tier = {
  label: string;
  value: string;
  note?: string;
};

type Exception = {
  area: string;
  description: string;
  note?: string;
};

type Program = {
  id: string;
  name: string;
  headline?: string;
  layer: "national" | "prefecture" | "municipal" | "prefecture_municipal";
  areaBadgeOverride?: string;
  category: string;
  amount: string;
  byChildren?: ByChildren;
  tiers?: Tier[];
  incomeLimit?: string;
  wardPatterns?: WardPattern[];
  incomeLimitNote?: string;
  eligibility?: string;
  requiredDocs?: string;
  window: string;
  kumaNote?: string;
  verifyNeeded: boolean;
  source?: string;
  verifiedAt?: string;
  exception?: Exception;
};

const programs = programsData.programs as Program[];

export const instant = false;

const LAYER_LABEL: Record<Program["layer"], string> = {
  national: "全国共通の制度",
  prefecture: "東京都在住なら誰でも",
  municipal: "台東区の制度",
  prefecture_municipal: "東京都・台東区の制度",
};

const AREA_BADGE: Record<Program["layer"], string> = {
  national: "全国",
  prefecture: "東京都",
  municipal: "台東区",
  prefecture_municipal: "東京都・台東区",
};

const CATEGORY_LABEL: Record<string, string> = {
  cash: "現金給付",
  medical: "医療費の助成",
  childcare: "保育料の助成",
  career: "資格・就労支援",
  tax: "税金の控除",
  insurance: "保険料の軽減",
  housing: "住まいの支援",
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

  const related = programs.filter((p) => p.id !== program.id).slice(0, 2);

  return (
    <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/" aria-label="トップへ戻る">
            <IconArrowLeft size={20} className="text-[#5F5E5A]" />
          </Link>
          <p className="text-xs text-[#888780]">
            支援制度 › {program.areaBadgeOverride ?? LAYER_LABEL[program.layer]}
          </p>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="inline-block w-fit rounded-full bg-[#F1EFE8] px-3 py-1 text-xs font-medium text-[#5F5E5A]">
            {CATEGORY_LABEL[program.category] ?? program.category}
          </span>
          <span className="inline-block w-fit rounded-full bg-[#E6F1FB] px-3 py-1 text-xs font-medium text-[#0C447C]">
            もらえるエリア: {program.areaBadgeOverride ?? AREA_BADGE[program.layer]}
          </span>
        </div>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-xl leading-snug font-medium">{program.name}</h1>
          {program.headline && (
            <span className="text-sm font-semibold text-[#993C1D]">
              {program.headline}
            </span>
          )}
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={40} />
          <p className="text-base leading-relaxed">
            {program.kumaNote ??
              "むずかしい言葉が多いけど、分からなかったらLINEで聞いてね。かみ砕いて説明するよ。"}
          </p>
        </div>

        <div className="mb-1 flex flex-col gap-0">
          {program.eligibility && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="mb-1 text-sm font-medium text-[#5F5E5A]">
                対象者
              </dt>
              <dd className="text-sm leading-relaxed">
                {program.eligibility}
              </dd>
            </div>
          )}
          {program.wardPatterns && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="mb-2 text-sm font-medium text-[#5F5E5A]">
                所得基準(お住まいの区で2パターン)
              </dt>
              <dd className="flex flex-col gap-2.5">
                {program.wardPatterns.map((pattern) => (
                  <div
                    key={pattern.label}
                    className="rounded-xl bg-[#FAECE7] px-3.5 py-3"
                  >
                    <p className="mb-1.5 text-xs font-semibold text-[#993C1D]">
                      {pattern.label}
                    </p>
                    <p className="mb-2.5 text-sm leading-snug font-medium text-[#712B13]">
                      {pattern.limits}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pattern.wards.map((ward) => (
                        <span
                          key={ward}
                          className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#712B13]"
                        >
                          {ward}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {program.incomeLimitNote && (
                  <p className="text-[11px] leading-relaxed text-[#888780]">
                    {program.incomeLimitNote}
                  </p>
                )}
              </dd>
            </div>
          )}
          {!program.wardPatterns && program.incomeLimit && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="mb-2 text-sm font-medium text-[#5F5E5A]">
                所得基準
              </dt>
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3 text-left">
                {formatAmountLines(program.incomeLimit).map((line, i) => (
                  <p
                    key={i}
                    className="text-sm leading-snug font-medium text-[#712B13]"
                  >
                    {line}
                  </p>
                ))}
              </dd>
            </div>
          )}

          {/* もらえる金額・助成内容: 淡い色の箱、左揃え、数字を強調 */}
          <div className="border-b border-[#D3D1C7] py-3">
            <dt className="mb-2 text-sm font-medium text-[#5F5E5A]">
              もらえる金額・助成内容
            </dt>
            {program.byChildren ? (
              <dd className="rounded-xl bg-[#FAECE7] px-3.5 py-3">
                {program.byChildren.note && (
                  <p className="mb-2.5 text-xs leading-relaxed text-[#993C1D]">
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
                        <span className="text-xs text-[#5F5E5A]">
                          子ども{row.children}人
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm leading-snug font-semibold text-[#712B13]">
                          {row.full.toLocaleString()}円
                        </p>
                        {row.partialMin !== undefined && (
                          <p className="text-[11px] text-[#993C1D]">
                            一部支給 {row.partialMin.toLocaleString()}〜
                            {row.partialMax?.toLocaleString()}円
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[11px] leading-relaxed text-[#993C1D]">
                  それ以降は子ども1人につき+
                  {program.byChildren.extraPerChild.full.toLocaleString()}円
                  {program.byChildren.extraPerChild.partialMin !== undefined &&
                    `(一部支給は+${program.byChildren.extraPerChild.partialMin.toLocaleString()}〜${program.byChildren.extraPerChild.partialMax?.toLocaleString()}円)`}
                </p>
              </dd>
            ) : program.tiers ? (
              <dd className="flex flex-col gap-2">
                {program.tiers.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-xl bg-[#FAECE7] px-3.5 py-3"
                  >
                    <p className="mb-1 text-xs font-semibold text-[#993C1D]">
                      {tier.label}
                    </p>
                    <p className="text-base leading-snug font-semibold text-[#712B13]">
                      {tier.value}
                    </p>
                    {tier.note && (
                      <p className="mt-1 text-[11px] leading-relaxed text-[#993C1D]">
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
                    className="text-sm leading-snug font-medium text-[#712B13]"
                  >
                    {line}
                  </p>
                ))}
              </dd>
            )}
          </div>

          {program.exception && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="mb-2 text-sm font-medium text-[#5F5E5A]">
                さらに上乗せがある市区町村
              </dt>
              <dd className="rounded-xl bg-[#EAF7EE] px-3.5 py-3">
                <span className="mb-1.5 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#1F7A3D]">
                  {program.exception.area}だけの上乗せ
                </span>
                <p className="text-sm leading-snug font-semibold text-[#1F7A3D]">
                  {program.exception.description}
                </p>
                {program.exception.note && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#3C8C57]">
                    {program.exception.note}
                  </p>
                )}
              </dd>
            </div>
          )}

          {program.requiredDocs && (
            <div className="border-b border-[#D3D1C7] py-3">
              <dt className="mb-1 text-sm font-medium text-[#5F5E5A]">
                必要書類
              </dt>
              <dd className="text-sm leading-relaxed">
                {program.requiredDocs}
              </dd>
            </div>
          )}
          <div className="border-b border-[#D3D1C7] py-3">
            <dt className="mb-1 text-sm font-medium text-[#5F5E5A]">
              申請窓口
            </dt>
            <dd className="text-sm leading-relaxed">{program.window}</dd>
          </div>

          {program.verifyNeeded ? (
            <p className="py-3 text-xs text-[#BA7517]">
              この制度の数字は現在確認中です。公開前に最新情報を確認します。
            </p>
          ) : (
            program.source && (
              <div className="py-3">
                <dt className="mb-1 text-sm font-medium text-[#5F5E5A]">
                  詳しくはこちら
                </dt>
                <dd className="text-sm">
                  <a
                    href={program.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#185FA5] underline"
                  >
                    公式ページで確認する(最終確認 {program.verifiedAt})
                  </a>
                </dd>
              </div>
            )
          )}
        </div>

        <p className="mb-5 text-[11px] leading-relaxed text-[#888780]">
          情報は目安です。正式な判定や最新の基準は窓口でご確認ください。
        </p>

        <div className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-4">
          <p className="mb-2.5 text-sm leading-relaxed">
            この制度、自分は対象になる?
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

        <p className="mb-2.5 text-sm font-medium">関連する制度</p>
        <div className="mb-5 flex flex-col gap-1.5">
          {related.map((r) => (
            <Link
              key={r.id}
              href={`/seido/${r.id}`}
              className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-2.5"
            >
              <p className="text-sm">{r.name}</p>
              <IconChevronRight size={16} className="text-[#888780]" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={32} />
          <p className="flex-1 text-[13px]">LINEで簡単手当診断をしてみる</p>
          <a
            href={LINE_ADD_FRIEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap text-white"
            style={{ backgroundColor: LINE_GREEN }}
          >
            診断する
          </a>
        </div>
      </main>
    </div>
  );
}
