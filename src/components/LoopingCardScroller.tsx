"use client";

import { useRef } from "react";
import Link from "next/link";

type CardItem = {
  id: string;
  label: string;
  value: string;
};

// 手動スワイプの横スクロールだが、末尾まで行くと先頭に自動で戻る(ループする)。
// 実装: カードを2セット並べておき、1セット分スクロールしたら見た目が同じ
// 2セット目の位置から、瞬時に(アニメーションなしで)1セット目の同じ位置へ
// scrollLeftを戻す。中身が同じなので見た目のジャンプは起きない
export function LoopingCardScroller({
  items,
  hrefPrefix,
}: {
  items: CardItem[];
  hrefPrefix: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const singleSetWidth = el.scrollWidth / 2;
    if (el.scrollLeft >= singleSetWidth) {
      el.scrollLeft -= singleSetWidth;
    }
  }

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      className="mb-2.5 flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[...items, ...items].map((item, i) => (
        <Link
          key={`${item.id}-${i}`}
          href={`${hrefPrefix}/${item.id}`}
          className="flex h-[96px] w-[152px] shrink-0 flex-col justify-center rounded-2xl bg-[#F1EFE8] px-3 py-2"
        >
          <p className="text-caption mb-1 line-clamp-2 text-[#888780]">{item.label}</p>
          <p className="text-body line-clamp-2 font-medium">{item.value}</p>
        </Link>
      ))}
    </div>
  );
}
