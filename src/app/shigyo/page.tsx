import { PageHeader } from "@/components/Breadcrumb";
import { BearParentChild } from "@/components/Bear";
import { IconScale } from "@tabler/icons-react";

export const metadata = { title: "士業の方へ | ハハナビ" };

// 企業の方へ(/company)とはページを分ける。中身は未検討、ダミーのプレースホルダー
export default function ShigyoPage() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <PageHeader items={[{ label: "士業の方へ" }]} />
          <h1 className="mb-4 text-lg font-medium">士業の方へ</h1>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3.5">
            <BearParentChild size={40} />
            <p className="text-sm leading-relaxed">
              社労士・弁護士など、ひとり親家庭を支えてくれる専門家向けのページを準備中だよ。
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-10 text-center">
            <IconScale size={32} className="text-[#888780]" />
            <p className="text-sm leading-relaxed text-[#888780]">
              近日公開予定です。
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
