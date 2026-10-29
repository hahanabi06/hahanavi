"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconChevronRight,
  IconMessageCircle2,
  IconMapPin,
} from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import programsData from "@/data/programs.json";
import { LINE_GREEN, LINE_ADD_FRIEND_URL, PREFECTURES } from "@/lib/constants";
import { TOKYO_WARDS } from "@/lib/diagnosis";

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
  wardsAvailable?: "all" | string[];
};

const programs = programsData.programs as Program[];

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
        <span
          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[type]}`}
        >
          {type}
        </span>
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

export default function SeidoListPage() {
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
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <SiteLogoLink />
        <h1 className="mb-4 text-lg font-medium">支援制度一覧</h1>

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={40} />
          <p className="text-sm leading-relaxed">
            使える制度は、お住まいの地域によって変わるよ。「全国」「都道府県」「市区町村」の順に、対象が広い制度から並べているから、上から見てみてね。47都道府県・東京23区まで、もうぜんぶ調べてあるよ。
          </p>
        </div>

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
          emptyMessage={`47都道府県すべて調べたけど、${prefecture}独自の上乗せ制度は見つからなかったよ(国の制度は上の「全国」欄をチェックしてね)。`}
        />
        {isTokyo && (
          <ProgramGroup
            title={`${ward}にお住まいなら使える制度`}
            items={municipalItems}
            emptyMessage="準備中です。今は東京都23区のデータのみ対応しています。もうしばらく待ってね。"
          />
        )}

        <div className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-4">
          <p className="mb-2.5 text-sm leading-relaxed">
            どの制度が使えるか分からない?
            <br />
            LINEで聞くだけで、合わせていくらもらえるか診断するよ
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
    </>
  );
}
