"use client";

import { useState } from "react";

export function ReportForm({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          programName,
          message,
          source: "program_detail",
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="py-3 text-sm leading-relaxed text-[#5F5E5A]">
        報告ありがとうございます。確認して必要があれば修正します。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="py-3">
      <p className="mb-1.5 text-sm font-medium text-[#5F5E5A]">
        この情報、間違ってるかも?
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="例: 金額が古い気がする、対象者の条件が違う気がする など"
        className="mb-2 h-16 w-full resize-none rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-xs outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        className="rounded-full bg-[#D85A30] px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {status === "sending" ? "送信中..." : "送る"}
      </button>
      {status === "error" && (
        <p className="mt-1.5 text-xs text-[#D85A30]">
          送信に失敗しました。もう一度お試しください。
        </p>
      )}
    </form>
  );
}
