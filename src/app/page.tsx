import {
  IconCoin,
  IconNews,
  IconCertificate,
  IconBriefcase,
  IconChevronRight,
  IconMessageCircle2,
} from "@tabler/icons-react";
import Link from "next/link";
import { BearParentChild } from "@/components/Bear";
import { BearGreeting } from "@/components/BearGreeting";
import { SiteHeader } from "@/components/SiteHeader";
import { RequestForm } from "@/components/RequestForm";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";
import { listPublishedArticles } from "@/lib/notion";
import { cacheLife } from "next/cache";
import programsData from "@/data/programs.json";
import { ArticleEyecatch } from "@/lib/article-category";
import { QUALIFICATIONS } from "@/lib/qualifications";

function LineButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={LINE_ADD_FRIEND_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white ${className}`}
      style={{ backgroundColor: LINE_GREEN }}
    >
      <IconMessageCircle2 size={16} />
      {children}
    </a>
  );
}

function SectionHeading({
  title,
  showAll = true,
  href = "#",
  linkLabel = "全部見る",
}: {
  title: string;
  showAll?: boolean;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <p className="text-base font-medium">{title}</p>
      {showAll && (
        <Link href={href} className="text-sm text-[#993C1D]">
          {linkLabel} ›
        </Link>
      )}
    </div>
  );
}

// トップページはまだ都道府県セレクターが無いので、全国制度+東京都の制度だけを表示する
// (他県の制度を都道府県未選択のまま全員に見せると混乱を招くため)。
const PROGRAMS = programsData.programs
  .filter((p) => !p.prefecture || p.prefecture === "東京都")
  .map((p) => ({
    id: p.id,
    label: p.name,
    value: p.headline ?? "詳細を見る",
  }));

type RankItem = {
  text: string;
  href: string | null;
  isNew?: boolean;
  category?: string;
};

const DUMMY_ARTICLES: RankItem[] = [
  { text: "え、知らなかった。月1万円以上増える制度があった", href: null, category: "お金" },
  { text: "資格、お金かけずに取れるって本当?", href: null, category: "資格・仕事" },
  { text: "元夫からの連絡、もう無視していいよ", href: null, category: "人間関係・気持ち" },
  { text: "ひとりで抱え込まなくていいよ、って話", href: null, category: "人間関係・気持ち" },
  { text: "知らないと損する、使える制度まとめ", href: null, category: "お金" },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 新着2件(NEWバッジ付き)+ランダム3件の、計5件を表示する。記事が足りない分はダミーで埋める
async function getHomeArticles(): Promise<{ articles: RankItem[] }> {
  "use cache";
  cacheLife("minutes");
  try {
    const articles = await listPublishedArticles(); // 新着順(created_time desc)で返る
    if (articles.length === 0) {
      return { articles: DUMMY_ARTICLES };
    }

    const newest = articles.slice(0, 2).map((a) => ({
      text: a.title,
      href: `/kiji/${a.id}`,
      isNew: true,
      category: a.category,
    }));
    const randomRest = shuffle(articles.slice(2))
      .slice(0, 3)
      .map((a) => ({ text: a.title, href: `/kiji/${a.id}`, category: a.category }));

    const combined: RankItem[] = [...newest, ...randomRest];
    const padded = [...combined];
    let i = 0;
    while (padded.length < 5 && i < DUMMY_ARTICLES.length) {
      padded.push(DUMMY_ARTICLES[i]);
      i++;
    }

    return { articles: padded.slice(0, 5) };
  } catch {
    return { articles: DUMMY_ARTICLES };
  }
}

const NAV_ITEMS = [
  { icon: IconCoin, label: "支援制度", href: "/seido" },
  { icon: IconNews, label: "お役立ち記事", href: "/kiji" },
  { icon: IconCertificate, label: "おすすめ資格", href: "/shikaku" },
  { icon: IconBriefcase, label: "ママ向け求人", href: "/kyujin" },
];

export default async function Home() {
  const { articles: homeArticles } = await getHomeArticles();
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pb-5">
        {/* header: ロゴ + メニュー */}
        <SiteHeader />

        {/* icon nav */}
        <div className="my-5 flex justify-between">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} className="flex w-20 flex-col items-center gap-1.5">
              <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#F1EFE8]">
                <Icon size={21} className="text-[#5F5E5A]" />
              </div>
              <span className="text-center text-xs leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* greeting */}
        <BearGreeting />

        {/* 支援制度 */}
        <section className="mb-6">
          <SectionHeading title="支援制度" href="/seido" />
          <div className="mb-2.5 flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PROGRAMS.map((p) => (
              <Link
                key={p.id}
                href={`/seido/${p.id}`}
                className="flex h-[96px] w-[152px] shrink-0 flex-col justify-center rounded-2xl bg-[#F1EFE8] px-3 py-2"
              >
                <p className="mb-1 line-clamp-2 text-xs text-[#888780]">{p.label}</p>
                <p className="line-clamp-2 text-base font-medium">{p.value}</p>
              </Link>
            ))}
          </div>
          <LineButton>LINEで簡単手当診断をしてみる</LineButton>
        </section>

        {/* 記事: 新着2件 + ランダム3件 */}
        <section className="mb-6">
          <SectionHeading title="お役立ち記事" href="/kiji" linkLabel="記事一覧へ" />

          <div className="flex flex-col gap-1.5">
            {homeArticles.map((item) => {
              const inner = (
                <>
                  <ArticleEyecatch category={item.category} size={48} />
                  <p className="line-clamp-2 flex-1 text-sm leading-snug">{item.text}</p>
                  {item.isNew ? (
                    <span className="shrink-0 rounded-full bg-[#FCEAE3] px-2 py-0.5 text-[10px] font-semibold text-[#B8491F]">
                      NEW
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-semibold text-[#0C447C]">
                      PICK
                    </span>
                  )}
                </>
              );
              return item.href ? (
                <Link
                  key={item.text}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3 py-2"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5 rounded-xl bg-[#F1EFE8] px-3 py-2"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {/* おすすめ資格 */}
        <section className="mb-6">
          <SectionHeading title="おすすめ資格" href="/shikaku" linkLabel="資格制度一覧へ" />
          <div className="flex gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUALIFICATIONS.map(({ icon: Icon, label, note }) => (
              <Link
                key={label}
                href="/shikaku"
                className="flex h-[96px] w-[120px] shrink-0 flex-col justify-center rounded-2xl bg-[#F1EFE8] px-3 py-3"
              >
                <Icon size={18} className="text-[#5F5E5A]" />
                <p className="mt-1.5 line-clamp-1 text-sm font-medium">{label}</p>
                <p className="line-clamp-2 text-xs text-[#888780]">{note}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 求人 */}
        <section className="mb-6">
          <p className="mb-2.5 text-base font-medium">ママ向け求人</p>
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-3.5 py-3.5">
            <IconBriefcase size={18} className="text-[#888780]" />
            <p className="text-sm text-[#888780]">
              近日公開。LINEでお知らせします。
            </p>
          </div>
        </section>

        {/* ご要望フォーム */}
        <section className="mb-5 rounded-2xl bg-[#F1EFE8] px-4 py-4">
          <p className="mb-0.5 text-base font-medium">こんな情報、欲しいな?</p>
          <p className="mb-2.5 text-sm leading-relaxed text-[#5F5E5A]">
            載ってない制度や記事のリクエスト、誰でも送っていいよ
          </p>
          <RequestForm />
        </section>

        {/* bottom LINE bar */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F1EFE8] px-4 py-3">
          <BearParentChild size={32} />
          <p className="flex-1 text-sm">LINEで簡単手当診断をしてみる</p>
          <a
            href={LINE_ADD_FRIEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white"
            style={{ backgroundColor: LINE_GREEN }}
          >
            追加
          </a>
        </div>

        <div className="mt-8 border-t border-[#E3E0D6] pt-5">
          <Link
            href="/company"
            className="mb-5 flex items-center justify-between rounded-2xl bg-[#FAECE7] px-4 py-3.5"
          >
            <div>
              <p className="text-sm font-medium text-[#712B13]">企業の方へ</p>
              <p className="text-xs text-[#993C1D]">
                採用・PRでのご活用はこちら
              </p>
            </div>
            <IconChevronRight size={18} className="shrink-0 text-[#993C1D]" />
          </Link>
        </div>

        <div className="mt-5 flex justify-center gap-3 text-xs text-[#888780]">
          <Link href="/about">運営者情報</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href="/terms">利用規約</Link>
        </div>
        </main>
      </div>
    </>
  );
}
