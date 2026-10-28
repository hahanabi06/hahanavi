import {
  IconMenu2,
  IconCoin,
  IconNews,
  IconCertificate,
  IconBriefcase,
  IconChevronRight,
  IconStethoscope,
  IconBabyCarriage,
  IconHeartHandshake,
  IconKeyboard,
  IconMessageCircle2,
} from "@tabler/icons-react";
import Link from "next/link";
import { BearFace, BearParentChild } from "@/components/Bear";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

function LineButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={LINE_ADD_FRIEND_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white ${className}`}
      style={{ backgroundColor: LINE_GREEN }}
    >
      <IconMessageCircle2 size={16} />
      {children}
    </a>
  );
}

function SectionHeading({
  title,
  showAll = true,
}: {
  title: string;
  showAll?: boolean;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <p className="text-base font-medium">{title}</p>
      {showAll && (
        <a href="#" className="text-xs text-[#993C1D]">
          全部見る ›
        </a>
      )}
    </div>
  );
}

// 検証済みデータ(src/data/programs.json)から抜粋した要約。詳細・最新の出典は各詳細ページ側で確認できる。
const PROGRAMS = [
  { id: "jidou-fuyou-teate", label: "児童扶養手当", value: "月48,050円〜" },
  { id: "maruoya-iryouhi", label: "マル親医療費助成", value: "ほぼ無料に" },
  { id: "jidou-ikusei-teate", label: "児童育成手当", value: "月13,500円" },
  { id: "koutou-shokugyou-kunren", label: "資格取得の生活費支援", value: "月15万円まで" },
];

const RANKING = [
  {
    text: "え、知らなかった。月1万円以上増える制度があった",
    href: "/kiji/jidou-ikusei-teate-ikura",
  },
  { text: "資格、お金かけずに取れるって本当?", href: null },
  { text: "元夫からの連絡、もう無視していいよ", href: null },
];

const QUALIFICATIONS = [
  { icon: IconStethoscope, label: "医療事務", note: "給付金で実質無料" },
  { icon: IconBabyCarriage, label: "保育士", note: "需要が高く安定" },
  { icon: IconHeartHandshake, label: "介護職", note: "未経験でも可" },
  { icon: IconKeyboard, label: "PCスキル", note: "在宅ワークに" },
];

const NAV_ITEMS = [
  { icon: IconCoin, label: "支援制度" },
  { icon: IconNews, label: "お役立ち記事" },
  { icon: IconCertificate, label: "おすすめ資格" },
  { icon: IconBriefcase, label: "ママ向け求人" },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 py-5">
        {/* header */}
        <div className="mb-1 flex items-center justify-between">
          <IconMenu2 size={20} className="text-[#5F5E5A]" />
          <div className="text-center">
            <p className="text-sm font-medium">ハハナビ</p>
            <p className="text-[10px] text-[#888780]">
              シングルマザーのための情報サイト
            </p>
          </div>
          <a href="#" className="text-[10px] text-[#888780]">
            企業の方へ
          </a>
        </div>

        {/* icon nav */}
        <div className="my-5 flex justify-between">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#F1EFE8]">
                <Icon size={21} className="text-[#5F5E5A]" />
              </div>
              <span className="text-[10px]">{label}</span>
            </div>
          ))}
        </div>

        {/* greeting */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
          <BearParentChild size={56} />
          <p className="text-sm leading-relaxed">
            今日、しんどかったね。ここにいるよ。
          </p>
        </div>

        {/* 支援制度 */}
        <section className="mb-6">
          <SectionHeading title="支援制度" />
          <div className="mb-2.5 flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PROGRAMS.map((p) => (
              <Link
                key={p.id}
                href={`/seido/${p.id}`}
                className="min-w-[118px] shrink-0 rounded-2xl bg-[#F1EFE8] px-3 py-3"
              >
                <p className="mb-1 text-[10px] text-[#888780]">{p.label}</p>
                <p className="text-sm font-medium">{p.value}</p>
              </Link>
            ))}
          </div>
          <LineButton>LINEで簡単手当診断をしてみる</LineButton>
        </section>

        {/* 記事ランキング */}
        <section className="mb-6">
          <SectionHeading title="お役立ち記事、今週の人気ランキング" />
          <div className="flex flex-col gap-1.5">
            {RANKING.map((item, i) => {
              const inner = (
                <>
                  <span className="text-base font-medium text-[#B4B2A9]">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-snug">{item.text}</p>
                </>
              );
              return item.href ? (
                <Link
                  key={item.text}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-2.5"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-2.5"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {/* おすすめ資格 */}
        <section className="mb-6">
          <SectionHeading title="おすすめ資格" />
          <div className="flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUALIFICATIONS.map(({ icon: Icon, label, note }) => (
              <div
                key={label}
                className="min-w-[108px] shrink-0 rounded-2xl bg-[#F1EFE8] px-3 py-3"
              >
                <Icon size={18} className="text-[#5F5E5A]" />
                <p className="mt-1.5 text-[11.5px] font-medium">{label}</p>
                <p className="text-[10px] text-[#888780]">{note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 求人 */}
        <section className="mb-6">
          <p className="mb-2.5 text-base font-medium">ママ向け求人</p>
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-3.5 py-3.5">
            <IconBriefcase size={18} className="text-[#888780]" />
            <p className="text-xs text-[#888780]">
              近日公開。LINEでお知らせします。
            </p>
          </div>
        </section>

        {/* ご要望フォーム */}
        <section className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-4">
          <p className="mb-0.5 text-sm font-medium">こんな情報、欲しいな?</p>
          <p className="mb-2.5 text-xs leading-relaxed text-[#5F5E5A]">
            載ってない制度や記事のリクエスト、誰でも送っていいよ
          </p>
          <input
            type="text"
            placeholder="お名前(なくてもOK)"
            className="mb-2 w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
          />
          <textarea
            placeholder="例: 〇〇区の住宅支援についても知りたい"
            className="mb-2.5 h-16 w-full resize-none rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
          />
          <button className="w-full rounded-full bg-[#D85A30] px-4 py-2.5 text-sm font-medium text-white">
            送る
          </button>
        </section>

        {/* bottom LINE bar */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={32} />
          <p className="flex-1 text-[11.5px]">LINEで簡単手当診断をしてみる</p>
          <a
            href={LINE_ADD_FRIEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-medium whitespace-nowrap text-white"
            style={{ backgroundColor: LINE_GREEN }}
          >
            追加
          </a>
        </div>
      </main>
    </div>
  );
}
