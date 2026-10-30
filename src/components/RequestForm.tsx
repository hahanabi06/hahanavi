"use client";

import { useState } from "react";

export function RequestForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    try {
      const fullMessage = name.trim()
        ? `【お名前: ${name.trim()}】\n${message}`
        : message;
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: fullMessage,
          source: "homepage_request",
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      setName("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm leading-relaxed text-[#5F5E5A]">
        送ってくれてありがとう!とっても助かるよ♪
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="お名前(なくてもOK)"
        className="mb-2 w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          "例:\n・〇〇区の住宅支援についても知りたい\n・〇〇県の〇〇の制度、すごく良いから見てみて\n・〇〇について困ってるんだ"
        }
        className="mb-2.5 h-28 w-full resize-none rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        className="w-full rounded-full bg-[#D85A30] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
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
