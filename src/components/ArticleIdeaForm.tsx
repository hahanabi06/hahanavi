"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArticleIdeaForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit() {
    if (!text.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/article-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: text }),
      });
      if (!res.ok) throw new Error();
      setText("");
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus("idle");
        }}
        placeholder="記事にしたいアイデアをメモ(例: 面会交流のルールの決め方について)"
        rows={2}
        className="rounded-lg border border-[#E3E0D6] bg-white px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={status === "sending" || !text.trim()}
          className="rounded-full bg-[#D85A30] px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {status === "sending" ? "保存中..." : "アイデアを保存"}
        </button>
        {status === "error" && (
          <span className="text-xs text-red-700">保存に失敗しました</span>
        )}
      </div>
    </div>
  );
}
