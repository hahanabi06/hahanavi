import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CompanyInquiryForm } from "@/components/CompanyInquiryForm";
import { BearParentChild } from "@/components/Bear";

export const metadata = { title: "企業の方へ | ハハナビ" };

export default function CompanyPage() {
  return (
    <>
      <PageHeader title="企業の方へ" backHref="/" fixed={false} />
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 py-5">
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
            <BearParentChild size={44} />
            <p className="text-base leading-relaxed">
              ハハナビを通じて、シングルマザーの採用・地方への移住者募集をお手伝いしています。
            </p>
          </div>

          <h1 className="mb-3 text-xl leading-snug font-medium">
            シングルマザー採用・地方採用をお考えの企業様へ
          </h1>
          <p className="mb-5 text-base leading-relaxed">
            ハハナビは、シングルマザー向けに支援制度の情報やLINE診断を届けているポータルサイトです。「働きたい」「必要なら住む場所も変えたい」と考えている利用者に、直接アプローチできます。
          </p>

          <section className="mb-5">
            <p className="mb-2.5 text-lg font-medium">
              シングルマザー採用のメリット
            </p>
            <div className="flex flex-col gap-2">
              <div className="rounded-xl bg-[#F1EFE8] px-3.5 py-3">
                <p className="mb-1 text-base leading-snug font-medium">
                  家計を支える強い就労意欲
                </p>
                <p className="text-sm leading-relaxed text-[#5F5E5A]">
                  生活のために働く必要性が高く、長く安定して働ける人材を求める企業と相性が良いと言われています。
                </p>
              </div>
              <div className="rounded-xl bg-[#F1EFE8] px-3.5 py-3">
                <p className="mb-1 text-base leading-snug font-medium">
                  人手不足の解消・多様な人材の確保
                </p>
                <p className="text-sm leading-relaxed text-[#5F5E5A]">
                  性別・年齢を問わず、意欲のある人材を幅広く採用したい企業にとって、新しい採用チャネルになります。
                </p>
              </div>
            </div>
          </section>

          <section className="mb-5">
            <p className="mb-2.5 text-lg font-medium">
              地方企業の採用・移住者募集もサポートします
            </p>
            <div className="rounded-xl bg-[#F1EFE8] px-3.5 py-3">
              <p className="text-base leading-relaxed">
                人手不足にお悩みの地方企業様へ。住まいの支援や生活環境の変化を前向きに考えているシングルマザーに向けて、「地方での仕事・暮らし」の魅力を伝える形でのご紹介も可能です。
              </p>
            </div>
          </section>

          <section className="mb-5">
            <p className="mb-2.5 text-lg font-medium">運営者について</p>
            <div className="rounded-xl bg-[#F1EFE8] px-3.5 py-3">
              <p className="text-base leading-relaxed">
                一橋大学経済学部を卒業後、マーケティングリサーチ会社、日系大手コンサルティングファームの公共分野における新規事業部門、外資系コンサルティングファームの戦略部門を経て、ハハナビを立ち上げました。
              </p>
              <Link
                href="/about"
                className="mt-1.5 inline-block text-sm text-[#185FA5] underline"
              >
                運営者情報を見る
              </Link>
            </div>
          </section>

          <section className="mb-5">
            <p className="mb-2.5 text-lg font-medium">お問い合わせ</p>
            <p className="mb-3 text-base leading-relaxed text-[#5F5E5A]">
              求人掲載、地方移住者募集、広告・協業など、まずはお気軽にご相談ください。
            </p>
            <CompanyInquiryForm />
          </section>
        </main>
      </div>
    </>
  );
}
