import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconChevronRight, IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import programsData from "@/data/programs.json";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

type Program = {
  id: string;
  name: string;
  layer: "national" | "prefecture" | "municipal" | "prefecture_municipal";
  category: string;
  amount: string;
  incomeLimit?: string;
  eligibility?: string;
  requiredDocs?: string;
  window: string;
  verifyNeeded: boolean;
  source?: string;
  verifiedAt?: string;
};

const programs = programsData.programs as Program[];

export const instant = false;

const LAYER_LABEL: Record<Program["layer"], string> = {
  national: "全国共通の制度",
  prefecture: "東京都在住なら誰でも",
  municipal: "台東区の制度",
  prefecture_municipal: "東京都・台東区の制度",
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
            <IconArrowLeft size={18} className="text-[#5F5E5A]" />
          </Link>
          <p className="text-[11px] text-[#888780]">
            支援制度 › {LAYER_LABEL[program.layer]}
          </p>
        </div>

        <h1 className="mb-1 text-lg leading-snug font-medium">
          {program.name}
        </h1>
        {program.verifiedAt && program.source ? (
          <p className="mb-3.5 text-[11px] text-[#888780]">
            最終確認: {program.verifiedAt} ・{" "}
            <a href={program.source} className="underline">
              出典ページ
            </a>
          </p>
        ) : (
          <p className="mb-3.5 text-[11px] text-[#BA7517]">
            この制度の数字は現在確認中です。公開前に最新情報を確認します。
          </p>
        )}

        <div className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-4 text-center">
          <p className="mb-1 text-[11px] text-[#888780]">もらえる金額・助成内容</p>
          <p className="text-base leading-relaxed font-medium">
            {program.amount}
          </p>
        </div>

        <dl className="mb-1">
          {program.eligibility && (
            <div className="flex justify-between gap-3 border-b border-[#D3D1C7] py-2.5">
              <dt className="shrink-0 text-xs text-[#5F5E5A]">対象者</dt>
              <dd className="text-right text-xs leading-relaxed">
                {program.eligibility}
              </dd>
            </div>
          )}
          {program.incomeLimit && (
            <div className="flex justify-between gap-3 border-b border-[#D3D1C7] py-2.5">
              <dt className="shrink-0 text-xs text-[#5F5E5A]">所得基準</dt>
              <dd className="text-right text-xs leading-relaxed">
                {program.incomeLimit}
              </dd>
            </div>
          )}
          {program.requiredDocs && (
            <div className="flex justify-between gap-3 border-b border-[#D3D1C7] py-2.5">
              <dt className="shrink-0 text-xs text-[#5F5E5A]">必要書類</dt>
              <dd className="text-right text-xs leading-relaxed">
                {program.requiredDocs}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="shrink-0 text-xs text-[#5F5E5A]">申請窓口</dt>
            <dd className="text-right text-xs leading-relaxed">
              {program.window}
            </dd>
          </div>
        </dl>

        <p className="mb-5 text-[10.5px] leading-relaxed text-[#888780]">
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
            {program.name}を診断してみる
          </a>
        </div>

        <p className="mb-2.5 text-xs font-medium">関連する制度</p>
        <div className="mb-5 flex flex-col gap-1.5">
          {related.map((r) => (
            <Link
              key={r.id}
              href={`/seido/${r.id}`}
              className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-2.5"
            >
              <p className="text-xs">{r.name}</p>
              <IconChevronRight size={15} className="text-[#888780]" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={32} />
          <p className="flex-1 text-[11.5px]">LINEで簡単手当診断</p>
          <a
            href={LINE_ADD_FRIEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-medium whitespace-nowrap text-white"
            style={{ backgroundColor: LINE_GREEN }}
          >
            診断する
          </a>
        </div>
      </main>
    </div>
  );
}
