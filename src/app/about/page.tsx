import { SiteLogoLink } from "@/components/SiteLogoLink";

export const metadata = { title: "運営者情報 | ハハナビ" };

export default function About() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <SiteLogoLink />
          <h1 className="mb-4 text-lg font-medium">運営者情報</h1>
          <div className="flex flex-col gap-4 text-base leading-relaxed">
            <section>
              <h2 className="mb-1 font-medium">サイト名</h2>
              <p>ハハナビ</p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">運営者</h2>
              <p>チームシングマ</p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">代表者の経歴</h2>
              <p>
                一橋大学を卒業後、マーケティングリサーチ会社、NTTデータグループ会社の新規事業開発部門、外資系コンサルティングファームの戦略部門を経て、ハハナビを立ち上げ
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">運営開始</h2>
              <p>2026年10月</p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">お問い合わせ</h2>
              <p>
                ホーム画面の「こんな情報、欲しいな?」フォームからご連絡ください。
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
