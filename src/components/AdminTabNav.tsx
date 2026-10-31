import Link from "next/link";

const TABS = [
  { key: "dashboard", label: "ダッシュボード", href: "/admin" },
  { key: "sns", label: "SNS管理", href: "/admin/sns" },
] as const;

export function AdminTabNav({ active }: { active: "dashboard" | "sns" }) {
  return (
    <div className="mb-6 flex gap-1 border-b border-[#E3E0D6]">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-4 py-2 text-sm font-medium ${
            tab.key === active
              ? "border-b-2 border-[#D85A30] text-[#D85A30]"
              : "text-[#888780] hover:text-[#5F5E5A]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
