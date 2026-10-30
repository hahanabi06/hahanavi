"use client";

import { useRouter } from "next/navigation";

type ArticleIdea = {
  id: number;
  idea: string;
  created_at: string;
};

export function ArticleIdeaList({ ideas }: { ideas: ArticleIdea[] }) {
  const router = useRouter();

  async function dismiss(id: number) {
    await fetch("/api/admin/article-idea", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "dismissed" }),
    });
    router.refresh();
  }

  if (ideas.length === 0) {
    return <p className="text-xs text-[#888780]">まだアイデアはありません。</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {ideas.map((idea) => (
        <div
          key={idea.id}
          className="flex items-start justify-between gap-2 rounded-lg bg-white px-3 py-2"
        >
          <p className="flex-1 text-sm whitespace-pre-wrap">{idea.idea}</p>
          <button
            onClick={() => dismiss(idea.id)}
            className="shrink-0 text-xs text-[#888780] underline"
          >
            消す
          </button>
        </div>
      ))}
    </div>
  );
}
