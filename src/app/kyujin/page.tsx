import { IconBriefcase, IconMessageCircle2 } from "@tabler/icons-react";
import { BearParentChild } from "@/components/Bear";
import { PageHeader } from "@/components/Breadcrumb";
import { LINE_GREEN, LINE_ADD_FRIEND_URL } from "@/lib/constants";

export const metadata = { title: "ママ向け求人 | ハハナビ" };

export default function KyujinPage() {
  return (
    <>
      <div className="flex min-h-full flex-1 justify-center bg-[var(--background)]">
        <main className="w-full max-w-md px-4 pt-6 pb-5">
          <PageHeader items={[{ label: "ママ向け求人" }]} />
          <h1 className="mb-4 text-lg font-medium">ママ向け求人</h1>
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <BearParentChild size={40} />
            <p className="text-sm leading-relaxed">
              ひとり親歓迎の求人、今準備中だよ。もうしばらく待ってね。
            </p>
          </div>

          <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-10 text-center">
            <IconBriefcase size={32} className="text-[#888780]" />
            <p className="text-sm leading-relaxed text-[#888780]">
              近日公開予定です。
              <br />
              公開されたらLINEでお知らせするよ。
            </p>
          </div>

          <div className="rounded-2xl bg-[#F1EFE8] px-4 py-4">
            <p className="mb-2.5 text-sm leading-relaxed">
              求人が公開されたら一番に知りたい?
              <br />
              LINEに登録しておくとお知らせが届くよ
            </p>
            <a
              href={LINE_ADD_FRIEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: LINE_GREEN }}
            >
              <IconMessageCircle2 size={16} />
              LINEに登録する
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
