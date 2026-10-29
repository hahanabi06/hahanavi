import { IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { SiteLogoLink } from "@/components/SiteLogoLink";
import { SeidoProgramList, type Program } from "@/components/SeidoProgramList";
import programsData from "@/data/programs.json";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

// クライアント側(SeidoProgramList)には一覧表示に使うフィールドだけを渡す。
// programs.jsonは都道府県リサーチが進むほど肥大化していく(各制度にamount/
// eligibility/kumaNote/source/note等の長文が入る)ので、まるごとクライアントの
// JSに埋め込むとページが重くなる。一覧に必要な分だけ先にサーバー側で絞り込む
const programs: Program[] = programsData.programs.map((p) => ({
  id: p.id,
  name: p.name,
  headline: p.headline,
  layer: p.layer as Program["layer"],
  prefecture: p.prefecture,
  areaBadgeOverride: p.areaBadgeOverride,
  category: p.category,
  wardsAvailable: p.wardsAvailable as Program["wardsAvailable"],
}));

export default function SeidoListPage() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <SiteLogoLink />
        <h1 className="mb-4 text-lg font-medium">支援制度一覧</h1>

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={40} />
          <p className="text-sm leading-relaxed">
            使える制度は、お住まいの地域によって変わるよ。「全国」「都道府県」「市区町村」の順に、対象が広い制度から並べているから、上から見てみてね。
            <br />
            都道府県別の制度と東京都の23区までは調べて載せてるけど、まだ見つけられてない制度もあるかも。気づいたことがあれば教えてね。見つかり次第、追加していくね。
          </p>
        </div>

        <SeidoProgramList programs={programs} />

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
