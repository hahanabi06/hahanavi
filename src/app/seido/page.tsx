import Link from "next/link";
import {
  IconArrowLeft,
  IconChevronRight,
  IconMessageCircle2,
} from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import programsData from "@/data/programs.json";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

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
  areaBadgeOverride?: string;
};

const programs = programsData.programs as Program[];

const GROUPS: { title: string; layers: Program["layer"][] }[] = [
  {
    title: "全国どこでも使える制度",
    layers: ["national", "national_prefecture_admin"],
  },
  { title: "東京都にお住まいなら使える制度", layers: ["prefecture"] },
  {
    title: "台東区にお住まいなら使える制度",
    layers: ["municipal", "prefecture_municipal"],
  },
];

export default function SeidoListPage() {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/" aria-label="トップへ戻る">
            <IconArrowLeft size={20} className="text-[#5F5E5A]" />
          </Link>
          <p className="text-sm font-medium">支援制度一覧</p>
        </div>

        <p className="mb-5 text-xs leading-relaxed text-[#888780]">
          使える制度は、お住まいの地域によって変わります。「全国」「東京都」「台東区」の順に、対象が広い制度から並べているよ。
        </p>

        {GROUPS.map((group) => {
          const items = programs.filter((p) => group.layers.includes(p.layer));
          if (items.length === 0) return null;
          return (
            <section key={group.title} className="mb-6">
              <p className="mb-2.5 text-sm font-medium">{group.title}</p>
              <div className="flex flex-col gap-1.5">
                {items.map((p) => (
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
          );
        })}

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
  );
}
