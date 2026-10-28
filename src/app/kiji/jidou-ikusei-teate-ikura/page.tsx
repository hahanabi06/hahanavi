import Link from "next/link";
import { IconArrowLeft, IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

export const metadata = {
  title: "え、知らなかった。月1万円以上増える制度があった | ハハナビ",
  description:
    "児童育成手当は東京都独自の制度で、23区どこに住んでいても子ども1人につき月13,500円もらえます。児童扶養手当とは別の制度なので、知らずに申請していない人も多いです。",
};

export default function Article() {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/" aria-label="トップへ戻る">
            <IconArrowLeft size={18} className="text-[#5F5E5A]" />
          </Link>
          <p className="text-[11px] text-[#888780]">お役立ち記事 › お金</p>
        </div>

        <h1 className="mb-1 text-lg leading-snug font-medium">
          え、知らなかった。月1万円以上増える制度があった
        </h1>
        <p className="mb-5 text-[11px] text-[#888780]">
          最終確認: 2026-10-28
        </p>

        <div className="mb-5 flex flex-col gap-3 text-sm leading-relaxed">
          <p>
            「児童扶養手当はもらってるけど、それで全部でしょ?」と思っていませんか。実は東京都には、児童扶養手当とは別の、もう1つの手当があります。
          </p>

          <p className="font-medium">
            児童育成手当。子ども1人につき月13,500円、東京都内なら23区どこに住んでいても対象です。
          </p>

          <p>
            児童扶養手当は国の制度で、所得が低いほど手厚い代わりに、所得が上がると一部支給・対象外になっていきます。一方、児童育成手当は東京都独自の制度で、所得制限がかなり緩やか(扶養0人で年収383.8万円未満)なので、「児童扶養手当は対象外だったから、もう何も無いと思っていた」という人が、実はこちらは対象というケースが結構あります。
          </p>

          <p>
            子どもが2人いれば月27,000円、3人なら月40,500円。年間にすると子ども1人で16万円以上になります。知らずに申請していないと、それだけ損していることになります。
          </p>

          <div className="rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
            <p className="mb-1 text-[11px] text-[#888780]">所得制限の目安(令和8年度)</p>
            <p className="text-[13px] leading-relaxed">
              扶養0人: 383.8万円未満 / 1人: 421.8万円未満 / 2人: 459.8万円未満
              <br />
              (4人以降は1人につき38万円加算)
            </p>
          </div>

          <p>
            申請はお住まいの区の子育て支援課で、戸籍謄本や振込先の通帳などが必要です。児童扶養手当とは別の申請になるので、「児童扶養手当を申請したから済んでいる」と思い込んでいる場合は要注意です。
          </p>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
          <BearParentChild size={44} />
          <p className="text-sm leading-relaxed">
            自分の場合いくらになるか、LINEで聞いてみて
          </p>
        </div>

        <a
          href={LINE_ADD_FRIEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: LINE_GREEN }}
        >
          <IconMessageCircle2 size={16} />
          LINEで簡単手当診断
        </a>

        <Link
          href="/seido/jidou-ikusei-teate"
          className="flex items-center justify-between gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-2.5"
        >
          <p className="text-xs">児童育成手当の制度詳細を見る</p>
        </Link>
      </main>
    </div>
  );
}
