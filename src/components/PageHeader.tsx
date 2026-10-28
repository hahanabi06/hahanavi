import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export function PageHeader({
  title,
  backHref,
  backLabel,
  fixed = true,
}: {
  title?: string;
  backHref: string;
  backLabel?: string;
  fixed?: boolean;
}) {
  const inner = (
    <div className="w-full max-w-md px-4 py-3">
      {backLabel ? (
        <Link href={backHref} className="flex items-center gap-2">
          <IconArrowLeft size={20} className="shrink-0 text-[#5F5E5A]" />
          <span className="text-sm text-[#5F5E5A]">{backLabel}</span>
        </Link>
      ) : (
        <>
          <Link href={backHref} aria-label="戻る" className="mb-1 inline-block">
            <IconArrowLeft size={20} className="text-[#5F5E5A]" />
          </Link>
          {title && <p className="text-base font-medium">{title}</p>}
        </>
      )}
    </div>
  );

  if (!fixed) {
    return (
      <div className="flex justify-center bg-[#E6F1FB]">{inner}</div>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex justify-center bg-[#E6F1FB]">
      {inner}
    </header>
  );
}
