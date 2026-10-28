"use client";

import { useState } from "react";

export function LinePushForm({ lineUserId }: { lineUserId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSend() {
    if (!text.trim()) return;
    if (!window.confirm("この内容でこの人にLINEメッセージを送信します。よろしいですか?")) {
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/line-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId, message: text }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setText("");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-medium text-[#D85A30] underline"
      >
        この人にメッセージを送る
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-[#E3E0D6] pt-2">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus("idle");
        }}
        placeholder="送る内容を入力(求人の案内など)"
        rows={3}
        className="rounded-lg border border-[#E3E0D6] bg-white px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={status === "sending" || !text.trim()}
          className="rounded-full bg-[#D85A30] px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {status === "sending" ? "送信中..." : "送信"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setStatus("idle");
          }}
          className="text-xs text-[#888780]"
        >
          閉じる
        </button>
        {status === "sent" && (
          <span className="text-xs text-green-700">送信しました</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-700">送信に失敗しました</span>
        )}
      </div>
    </div>
  );
}
