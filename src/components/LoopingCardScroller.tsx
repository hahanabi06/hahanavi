"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";

type CardItem = {
  id: string;
  label: string;
  value: string;
};

// 手動スワイプの横スクロールだが、前方向(末尾→先頭)・後方向(先頭→末尾)の
// どちらにループする。実装: カードを3セット並べて真ん中のセットから表示を始め、
// 両端(1セット目/3セット目)に入ったら、瞬時に(アニメーションなしで)
// 真ん中セットの同じ位置へscrollLeftを戻す。中身が同じなので見た目のジャンプは起きない
export function LoopingCardScroller({
  items,
  hrefPrefix,
}: {
  items: CardItem[];
  hrefPrefix: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth / 3;
  }, []);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const singleSetWidth = el.scrollWidth / 3;
    if (el.scrollLeft >= singleSetWidth * 2) {
      el.scrollLeft -= singleSetWidth;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += singleSetWidth;
    }
  }

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      className="mb-2.5 flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[...items, ...items, ...items].map((item, i) => (
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
