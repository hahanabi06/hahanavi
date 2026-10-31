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
  IconScale,
  IconInfoCircle,
  IconShieldLock,
  IconFileText,
  IconChevronRight,
} from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";

const MENU_LINKS = [
  { icon: IconCoin, label: "支援制度", href: "/seido" },
  { icon: IconNews, label: "お役立ち記事", href: "/kiji" },
  { icon: IconCertificate, label: "おすすめ資格", href: null },
  { icon: IconBriefcase, label: "ママ向け求人", href: "/kyujin" },
  { icon: IconBuildingStore, label: "企業の方へ", href: "/company" },
  { icon: IconScale, label: "士業の方へ", href: null },
];

const MENU_SUB_LINKS = [
  { icon: IconInfoCircle, label: "運営者情報", href: "/about" },
  { icon: IconShieldLock, label: "プライバシーポリシー", href: "/privacy" },
  { icon: IconFileText, label: "利用規約", href: "/terms" },
];

// ホームページ上部のロゴ+ハンバーガーメニュー。メニューは左寄せで画面の
// 6割程度の幅だけ覆うドロワーにして、全幅オーバーレイの圧迫感を避ける
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-5 -mx-4 flex items-center justify-between bg-[#E6F1FB] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <BearParentChild size={42} />
          <div className="text-left">
            <p className="font-heading text-2xl leading-tight font-bold text-[#D85A30]">
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
        <>
          {/* 裏の画面をうっすら暗くして、タップで閉じられるようにする */}
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/25"
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-[62%] max-w-[280px] flex-col overflow-y-auto bg-[var(--background)] px-4 pt-4 pb-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BearParentChild size={32} />
                <p className="font-heading text-lg leading-tight font-bold text-[#D85A30]">
                  ハハナビ
                </p>
              </div>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1EFE8]"
              >
                <IconX size={16} className="text-[#5F5E5A]" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {MENU_LINKS.map(({ icon: Icon, label, href }) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-[#F1EFE8] px-3 py-2.5"
                  >
                    <Icon size={16} className="shrink-0 text-[#5F5E5A]" />
                    <p className="flex-1 text-sm font-medium">{label}</p>
                    <IconChevronRight size={14} className="shrink-0 text-[#888780]" />
                  </Link>
                ) : (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl bg-[#F1EFE8] px-3 py-2.5"
                  >
                    <Icon size={16} className="shrink-0 text-[#5F5E5A]" />
                    <p className="flex-1 text-sm font-medium">{label}</p>
                  </div>
                ),
              )}

              <div className="mt-2 mb-1 h-px bg-[#E3E0D6]" />

              {MENU_SUB_LINKS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                >
                  <Icon size={14} className="shrink-0 text-[#888780]" />
                  <p className="flex-1 text-xs text-[#5F5E5A]">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
