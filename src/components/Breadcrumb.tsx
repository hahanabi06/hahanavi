import { Fragment } from "react";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { SiteLogoLink } from "@/components/SiteLogoLink";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

// 外部(検索・SNS等)から直接着地した人にも「今どこにいるか」を伝えるためのパンくず。
// SiteLogoLinkと横並びで使う想定(margin-bottomは呼び出し側のラッパーで管理)。
// 先頭に「トップ」を自動で足す。
// 各要素をnavの直下フラットなflex子要素にする(1段ネストすると、内側のtruncateが
// 効かずに最後の項目(記事タイトル等の長い文字列)がロゴと重なってはみ出すバグがあった)
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const allItems: BreadcrumbItem[] = [{ label: "トップ", href: "/" }, ...items];

  return (
    <nav className="flex min-w-0 items-center gap-1 text-xs text-[#888780]">
      {allItems.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <IconChevronRight size={12} className="shrink-0" />}
          {item.href ? (
            <Link href={item.href} className="shrink-0 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// 各ページの先頭で使う定型レイアウト: ロゴとパンくずを横並びにする。
// SiteLogoLink単体のmb-4を打ち消して、外側のdivのmb-4だけ効かせる
export function PageHeader({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="-mb-4 shrink-0">
        <SiteLogoLink />
      </div>
      <Breadcrumb items={items} />
    </div>
  );
}
