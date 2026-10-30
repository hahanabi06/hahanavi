"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronRight, IconMapPin } from "@tabler/icons-react";
import { PREFECTURES } from "@/lib/constants";
import { TOKYO_WARDS } from "@/lib/diagnosis";

export type Program = {
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
  wardsAvailable?: "all" | string[];
  hitorioyaOnly?: boolean; // 未指定(true扱い)ならひとり親限定、falseなら子育て世帯全般が対象
};

// 市区町村レベル(マル親など)の詳細データがあるのは今のところ東京都23区だけ。
// 都道府県レベルの制度は prefectureItems 側でprograms.jsonのprefecture一致で判定する
const SUPPORTED_PREFECTURE = "東京都";

// お金がもらえる制度 → 負担が軽くなる制度 → 返済が必要な貸付、の順でわかりやすく並べる
type BenefitType = "給付" | "軽減・免除" | "貸付";

const CATEGORY_TO_TYPE: Record<string, BenefitType> = {
  cash: "給付",
  career: "給付",
  education: "給付",
  housing: "給付",
  tax: "軽減・免除",
  insurance: "軽減・免除",
  childcare: "軽減・免除",
  medical: "軽減・免除",
  discount: "軽減・免除",
  loan: "貸付",
};

const TYPE_ORDER: BenefitType[] = ["給付", "軽減・免除", "貸付"];

const TYPE_BADGE: Record<BenefitType, string> = {
  給付: "bg-[#FCEAE3] text-[#B8491F]",
  "軽減・免除": "bg-[#E6F1FB] text-[#0C447C]",
  貸付: "bg-[#FDF3D9] text-[#8A6D1F]",
};

function typeOf(p: Program): BenefitType {
  return CATEGORY_TO_TYPE[p.category] ?? "給付";
}

function sortByType(items: Program[]): Program[] {
  return [...items].sort(
    (a, b) => TYPE_ORDER.indexOf(typeOf(a)) - TYPE_ORDER.indexOf(typeOf(b)),
  );
}

function ProgramCard({ p }: { p: Program }) {
  const type = typeOf(p);
  return (
    <Link
      href={`/seido/${p.id}`}
      className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span
            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[type]}`}
          >
            {type}
          </span>
          {p.hitorioyaOnly === false && (
            <span className="w-fit rounded-full bg-[#E9F3EA] px-2 py-0.5 text-[10px] font-medium text-[#1F7A3D]">
              子持ち全員
            </span>
          )}
        </div>
        <p className="text-sm leading-snug">{p.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {p.headline && (
          <span className="text-xs font-semibold whitespace-nowrap text-[#993C1D]">
            {p.headline}
          </span>
        )}
        <IconChevronRight size={16} className="text-[#888780]" />
      </div>
    </Link>
  );
}

function ProgramGroup({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Program[];
  emptyMessage: string;
}) {
  return (
    <section className="mb-6">
      <p className="mb-2.5 text-sm font-medium">{title}</p>
      {items.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {sortByType(items).map((p) => (
            <ProgramCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[#F1EFE8] px-3.5 py-4 text-xs leading-relaxed text-[#888780]">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

export function SeidoProgramList({ programs }: { programs: Program[] }) {
  const [prefecture, setPrefecture] = useState(SUPPORTED_PREFECTURE);
  const [ward, setWard] = useState("台東区");

  const nationalItems = programs.filter((p) =>
    ["national", "national_prefecture_admin"].includes(p.layer),
  );

  const isTokyo = prefecture === SUPPORTED_PREFECTURE;

  const prefectureItems = programs.filter(
    (p) => p.layer === "prefecture" && p.prefecture === prefecture,
  );

  const municipalItems = isTokyo
    ? programs.filter(
        (p) =>
          (p.layer === "municipal" || p.layer === "prefecture_municipal") &&
          (p.wardsAvailable === "all" ||
            (Array.isArray(p.wardsAvailable) &&
              p.wardsAvailable.includes(ward))),
      )
    : [];

  return (
    <>
      <div className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-[#5F5E5A]">
          <IconMapPin size={16} className="text-[#D85A30]" />
          お住まいの地域を選んでね
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
            aria-label="都道府県"
            className="min-w-0 flex-1 rounded-xl border border-[#E3E0D6] bg-white px-3 py-2.5 text-sm font-medium"
          >
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
          {isTokyo && (
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              aria-label="市区町村"
              className="min-w-0 flex-1 rounded-xl border border-[#E3E0D6] bg-white px-3 py-2.5 text-sm font-medium"
            >
              {TOKYO_WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <ProgramGroup
        title="全国どこでも使える制度"
        items={nationalItems}
        emptyMessage="準備中です。もうしばらく待ってね。"
      />
      <ProgramGroup
        title={`${prefecture}にお住まいなら使える制度`}
        items={prefectureItems}
        emptyMessage={`今のところ${prefecture}独自の上乗せ制度は見つけられてないよ(国の制度は上の「全国」欄をチェックしてね)。見つかり次第追加していくね。`}
      />
      {isTokyo && (
        <ProgramGroup
          title={`${ward}にお住まいなら使える制度`}
          items={municipalItems}
          emptyMessage="準備中です。今は東京都23区のデータのみ対応しています。もうしばらく待ってね。"
        />
      )}
    </>
  );
}
