import {
  BearMoney,
  BearHospital,
  BearHeart,
  BearWork,
  BearDefault,
} from "@/components/Bear";

export const ARTICLE_CATEGORIES = [
  "お金",
  "病院・健康",
  "人間関係・気持ち",
  "資格・仕事",
  "暮らし全般",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

const CATEGORY_ICON: Record<ArticleCategory, typeof BearMoney> = {
  お金: BearMoney,
  "病院・健康": BearHospital,
  "人間関係・気持ち": BearHeart,
  "資格・仕事": BearWork,
  暮らし全般: BearDefault,
};

function isArticleCategory(value: unknown): value is ArticleCategory {
  return (
    typeof value === "string" &&
    (ARTICLE_CATEGORIES as readonly string[]).includes(value)
  );
}

export function ArticleEyecatch({
  category,
  size = 56,
}: {
  category?: string;
  size?: number;
}) {
  const cat: ArticleCategory = isArticleCategory(category)
    ? category
    : "暮らし全般";
  const Icon = CATEGORY_ICON[cat];
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ width: size, height: size }}
    >
      <Icon size={size} />
    </div>
  );
}
