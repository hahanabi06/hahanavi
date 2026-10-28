import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "運営者情報 | ハハナビ" };

export default function About() {
  return (
    <>
      <PageHeader title="運営者情報" backHref="/" fixed={false} />
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 py-5">
          <div className="flex flex-col gap-4 text-base leading-relaxed">
            <section>
              <h2 className="mb-1 font-medium">サイト名</h2>
              <p>ハハナビ</p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">運営者</h2>
              <p>ハハナビ運営者(個人運営)</p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">運営者の経歴</h2>
              <p>
                一橋大学経済学部を卒業後、マーケティングリサーチ会社、日系大手コンサルティングファームの公共分野における新規事業部門、外資系コンサルティングファームの戦略部門を経て、ハハナビを立ち上げました。
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
