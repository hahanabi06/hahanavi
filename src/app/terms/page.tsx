import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "利用規約 | ハハナビ" };

export default function Terms() {
  return (
    <>
      <PageHeader title="利用規約" backHref="/" />
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-20 pb-5">
          <div className="flex flex-col gap-4 text-sm leading-relaxed">
            <p>
              この利用規約は、ハハナビ(以下「当サイト」)の利用条件を定めるものです。当サイトおよびLINE公式アカウントをご利用いただく方(以下「利用者」)には、本規約に同意いただいたものとみなします。
            </p>

            <section>
              <h2 className="mb-1 font-medium">情報の正確性について</h2>
              <p>
                当サイトおよびLINE公式アカウントで提供する支援制度の情報・診断結果は、公開時点で確認した内容をもとにした目安であり、正式な行政手続きにおける判定を保証するものではありません。実際の対象可否や金額は、必ずお住まいの自治体や関係窓口にご確認ください。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">禁止事項</h2>
              <p>当サイトのご利用にあたり、以下の行為を禁止します。</p>
              <ul className="mt-1.5 list-disc pl-5">
                <li>当サイトのサーバーやシステムに過度な負荷をかける行為</li>
                <li>当サイトのコンテンツを無断で複製・転載・改変する行為</li>
                <li>法令または公序良俗に違反する行為</li>
                <li>当サイトの運営を妨害する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-1 font-medium">著作権</h2>
              <p>
                当サイトに掲載する文章・デザイン等の著作権は、特に明記のない限り運営者に帰属します。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">サービスの変更・中断</h2>
              <p>
                運営者は、利用者への事前の通知なく、当サイトおよびLINE公式アカウントの内容を変更、または提供を中断・終了することがあります。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">免責事項</h2>
              <p>
                当サイトの情報を利用したことにより利用者に生じた損害について、運営者は法令上許容される範囲で責任を負わないものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">規約の変更</h2>
              <p>
                本規約は、必要に応じて予告なく変更することがあります。変更後の規約は、当サイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">準拠法</h2>
              <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
            </section>

            <section>
              <h2 className="mb-1 font-medium">お問い合わせ</h2>
              <p>
                本規約に関するお問い合わせは、ホーム画面の「こんな情報、欲しいな?」フォームからご連絡ください。
              </p>
            </section>

            <p className="text-xs text-[#888780]">最終改定日: 2026年10月28日</p>
          </div>
        </main>
      </div>
    </>
  );
}
