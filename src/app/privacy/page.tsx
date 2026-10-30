import { SiteLogoLink } from "@/components/SiteLogoLink";

export const metadata = { title: "プライバシーポリシー | ハハナビ" };

export default function Privacy() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
      <main className="w-full max-w-md px-4 pt-6 pb-5">
        <SiteLogoLink />
        <h1 className="mb-4 text-lg font-medium">プライバシーポリシー</h1>
        <div className="flex flex-col gap-4 text-sm leading-relaxed">
          <p>
            ハハナビ(以下「当サイト」)は、ご利用者の個人情報を以下の方針に基づいて取り扱います。
          </p>

          <section>
            <h2 className="mb-1 font-medium">取得する情報</h2>
            <p>
              当サイトでは、以下の情報を取得する場合があります。
            </p>
            <ul className="mt-1.5 list-disc pl-5">
              <li>
                LINE公式アカウントでの診断機能をご利用いただく際にお送りいただく、お住まいの地域・お子さまの人数・年収などのメッセージ内容
              </li>
              <li>
                各制度ページの「この情報、間違ってるかも?」フォーム、およびホーム画面の「こんな情報、欲しいな♪」フォームからお送りいただく、お名前(任意)・ご報告やご要望の内容
              </li>
              <li>
                各記事ページの閲覧回数(個人を特定しない、ページ単位の集計数のみ)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-1 font-medium">利用目的</h2>
            <p>
              お送りいただいた情報は、支援制度の診断結果をお返しする目的、いただいたご報告・ご要望を確認してサイトの情報を修正・改善する目的、人気記事の表示などサイトの機能を提供する目的、支援制度の更新等のお知らせをする目的、および求人を探している方への求人紹介の目的で利用します。
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-medium">保存について</h2>
            <p>
              LINEでお送りいただいたメッセージの内容(お住まいの地域・お子さまの人数・年収など診断のためにお送りいただいた情報、および最終利用日時)は、データベース(Supabase)に保存します。保存した情報は、再度の診断をスムーズにするため、支援制度の更新などのお知らせのため、および求人を探している方への求人紹介のために利用する場合があります。ご報告・ご要望フォームの内容も、同様にデータベース(Supabase)に保存し、運営者が内容を確認するために利用します。
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-medium">第三者提供</h2>
            <p>
              法令に基づく場合を除き、ご本人の同意なく第三者に個人情報を提供することはありません。
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-medium">利用しているサービス</h2>
            <p>
              当サイトはVercel(ホスティング)、Supabase(フォーム内容の保存)、LINE(診断機能の提供)、Notion(記事の管理)を利用しています。これらのサービスの利用にあたっては、各サービスのプライバシーポリシーも適用されます。
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-medium">削除のご希望・お問い合わせ</h2>
            <p>
              送信した内容の削除や、本ポリシーに関するお問い合わせは、ホーム画面の「こんな情報、欲しいな♪」フォームからご連絡ください。
            </p>
          </section>

          <p className="text-xs text-[#888780]">
            最終改定日: 2026年10月30日
          </p>
        </div>
      </main>
      </div>
    </>
  );
}
