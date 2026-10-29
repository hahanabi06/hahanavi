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
  IconChevronRight,
} from "@tabler/icons-react";
import { Zen_Maru_Gothic } from "next/font/google";
import { BearParentChild } from "@/components/Bear";

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

// ホームページ上部のロゴ+ハンバーガーメニュー。メニューはヘッダー直下に
// 開く小さめのドロップダウンにして、全画面に差し替わる唐突さを避ける
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative -mx-4 mb-5">
      <div className="flex items-center justify-between bg-[#E6F1FB] px-4 py-3">
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
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"
        >
          {open ? (
            <IconX size={18} className="text-[#5F5E5A]" />
          ) : (
            <IconMenu2 size={18} className="text-[#5F5E5A]" />
          )}
        </button>
      </div>

      {open && (
        <>
          {/* 裏の画面をうっすら暗くして、外側タップで閉じられるようにする */}
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/15"
          />
          <div className="absolute top-full right-0 left-0 z-50 flex flex-col gap-1 rounded-b-2xl bg-[var(--background)] px-4 pt-2 pb-3 shadow-lg">
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

            <div className="mt-2 mb-1 h-px bg-[#E3E0D6]" />

            {MENU_SUB_LINKS.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2"
              >
                <Icon size={16} className="text-[#888780]" />
                <p className="flex-1 text-sm text-[#5F5E5A]">{label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
