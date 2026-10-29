"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconMenu2,
  IconX,
  IconCoin,
  IconNews,
  IconCertificate,
  IconBriefcase,
  IconBuildingStore,
  IconInfoCircle,
  IconShieldLock,
  IconFileText,
  IconMessageCircle2,
  IconChevronRight,
} from "@tabler/icons-react";
import { Zen_Maru_Gothic } from "next/font/google";
import { BearParentChild } from "@/components/Bear";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["700"],
});

const MENU_LINKS = [
  { icon: IconCoin, label: "支援制度", href: "/seido" },
  { icon: IconNews, label: "お役立ち記事", href: "/kiji" },
  { icon: IconCertificate, label: "おすすめ資格", href: "/shikaku" },
  { icon: IconBriefcase, label: "ママ向け求人", href: "/kyujin" },
  { icon: IconBuildingStore, label: "企業の方へ", href: "/company" },
];

const MENU_SUB_LINKS = [
  { icon: IconInfoCircle, label: "運営者情報", href: "/about" },
  { icon: IconShieldLock, label: "プライバシーポリシー", href: "/privacy" },
  { icon: IconFileText, label: "利用規約", href: "/terms" },
];

// ホームページ上部のロゴ+ハンバーガーメニュー。メニューの中身はフルスクリーンの
// オーバーレイで、サイト全体のページ+LINE登録導線をまとめて出す
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-5 -mx-4 flex items-center justify-between bg-[#E6F1FB] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <BearParentChild size={42} />
          <div className="text-left">
            <p className={`${zenMaruGothic.className} text-2xl leading-tight text-[#D85A30]`}>
              ハハナビ
            </p>
            <p className="text-xs text-[#888780]">シングルマザーのための情報サイト</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="メニューを開く"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"
        >
          <IconMenu2 size={18} className="text-[#5F5E5A]" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center bg-[var(--background)]">
          <div className="flex w-full max-w-md flex-col px-4 pt-3 pb-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BearParentChild size={36} />
                <p className={`${zenMaruGothic.className} text-xl leading-tight text-[#D85A30]`}>
                  ハハナビ
                </p>
              </div>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EFE8]"
              >
                <IconX size={18} className="text-[#5F5E5A]" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              {MENU_LINKS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3.5 py-3"
                >
                  <Icon size={18} className="text-[#5F5E5A]" />
                  <p className="flex-1 text-sm font-medium">{label}</p>
                  <IconChevronRight size={16} className="text-[#888780]" />
                </Link>
              ))}

              <div className="mt-3 mb-1 h-px bg-[#E3E0D6]" />

              {MENU_SUB_LINKS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                >
                  <Icon size={16} className="text-[#888780]" />
                  <p className="flex-1 text-sm text-[#5F5E5A]">{label}</p>
                </Link>
              ))}
            </div>

            <a
              href={LINE_ADD_FRIEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: LINE_GREEN }}
            >
              <IconMessageCircle2 size={16} />
              LINEで簡単手当診断をしてみる
            </a>
          </div>
        </div>
      )}
    </>
  );
}
