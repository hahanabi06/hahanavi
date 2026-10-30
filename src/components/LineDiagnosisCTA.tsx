import { IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

// ページ内の主要なCTAとして使う、文章+大きいボタンのカード型
export function LineDiagnosisCard({
  lead,
  sub,
  className = "",
}: {
  lead: string;
  sub: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-[#F1EFE8] px-4 py-4 ${className}`}>
      <p className="mb-2.5 text-sm leading-relaxed">
        {lead}
        <br />
        {sub}
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
  );
}

// ページ下部の軽いリマインダーとして使う、くまアイコン+1行+小ボタンの帯型
export function LineDiagnosisBar({
  label = "診断する",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-4 py-3 ${className}`}
    >
      <BearParentChild size={32} />
      <p className="flex-1 text-[13px]">LINEで簡単手当診断をしてみる</p>
      <a
        href={LINE_ADD_FRIEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap text-white"
        style={{ backgroundColor: LINE_GREEN }}
      >
        {label}
      </a>
    </div>
  );
}
