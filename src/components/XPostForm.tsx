"use client";

import { useState } from "react";

type ArticleOption = { id: string; title: string };

export function XPostForm({ articles }: { articles: ArticleOption[] }) {
  const [articleId, setArticleId] = useState("");
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [status, setStatus] = useState<"idle" | "posting" | "posted" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [postedUrl, setPostedUrl] = useState("");

  function handleArticleChange(id: string) {
    setArticleId(id);
    if (id) {
      setReplyText(`くわしくはこちら\nhttps://hahanavi.com/kiji/${id}?from=x`);
    } else {
      setReplyText("");
    }
  }

  async function handlePost() {
    if (!text.trim()) return;
    if (
      !window.confirm(
        "この内容でハハナビ公式アカウント(@hahanavi_info)に投稿します。よろしいですか?"
      )
    ) {
      return;
    }
    setStatus("posting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/x-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, replyText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data?.error ?? "投稿に失敗しました");
        setStatus("error");
        return;
      }
      setStatus("posted");
      setPostedUrl(data?.tweetUrl ?? "");
      setText("");
      setReplyText("");
      setArticleId("");
    } catch {
      setErrorMessage("投稿に失敗しました");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#F1EFE8] px-4 py-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-[#888780]">
          リンクする記事(任意)
        </label>
        <select
          value={articleId}
          onChange={(e) => handleArticleChange(e.target.value)}
          className="w-full rounded-lg border border-[#E3E0D6] bg-white px-3 py-2 text-sm"
        >
          <option value="">選択しない</option>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#888780]">
          投稿本文({text.length}文字)
        </label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setStatus("idle");
          }}
          placeholder="本文を入力(リンクやハハナビの名前は入れない)"
          rows={4}
          className="w-full rounded-lg border border-[#E3E0D6] bg-white px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#888780]">
          セルフリプライ(任意、{replyText.length}文字)
        </label>
        <textarea
          value={replyText}
          onChange={(e) => {
            setReplyText(e.target.value);
            setStatus("idle");
          }}
          placeholder="本文への返信として投稿する内容(リンクなど)"
          rows={2}
          className="w-full rounded-lg border border-[#E3E0D6] bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePost}
          disabled={status === "posting" || !text.trim()}
          className="rounded-full bg-[#D85A30] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "posting" ? "投稿中..." : "Xに投稿する"}
        </button>
        {status === "posted" && (
          <span className="text-xs text-green-700">
            投稿しました
            {postedUrl && (
              <>
                {" "}
                <a
                  href={postedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  投稿を見る
                </a>
              </>
            )}
          </span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-700">{errorMessage}</span>
        )}
      </div>
    </div>
  );
}
