import { IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

// ページ最下部に1つだけ置く、LINE友だち登録への誘導。本文中には挟まず、
// 一番下だけなので太い枠+親子アイコンで存在感を出してよい
export function LineDiagnosisBar({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-[#E9F3EA] px-4 py-4 ${className}`}>
      <div className="mb-3 flex items-center gap-3">
        <BearParentChild size={40} />
        <p className="font-heading text-body leading-relaxed">
          LINEで友だちになってくれたら嬉しいな♪♪
          質問に答えるだけで、あなたが実際にいくらもらえるか診断できるよ
        </p>
      </div>
      <a
        href={LINE_ADD_FRIEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white"
        style={{ backgroundColor: LINE_GREEN }}
      >
        <IconMessageCircle2 size={16} />
        ハハナビ公式LINEを友だち追加
      </a>
    </div>
  );
}
