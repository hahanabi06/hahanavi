import Link from "next/link";
import { BearParentChild } from "@/components/Bear";

// 外部(検索・LINE等)から記事・制度の詳細ページに直接着地した人が、
// ホームに戻れる手段を持てるように、各ページの先頭に小さく置くロゴリンク
export function SiteLogoLink() {
  return (
    <Link href="/" className="mb-4 inline-flex items-center gap-1.5">
      <BearParentChild size={28} />
      <span className="font-heading text-base font-bold text-[#D85A30]">
        ハハナビ
      </span>
    </Link>
  );
}
