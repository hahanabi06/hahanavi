"use client";

import { useState } from "react";

const INTEREST_OPTIONS = [
  "シングルマザー向けの求人掲載",
  "地方移住・転居を伴う採用の募集",
  "広告・協業のご相談",
  "その他・まずは相談したい",
];

export function CompanyInquiryForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(INTEREST_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/company-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          phone,
          interest,
          message,
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
      <div className="rounded-2xl bg-[#F1EFE8] px-4 py-4 text-sm leading-relaxed">
        お問い合わせありがとうございます。内容を確認のうえ、ご連絡先のメールアドレスにご連絡いたします。
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl bg-[#F1EFE8] px-4 py-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5F5E5A]">
          会社名 <span className="text-[#D85A30]">*</span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5F5E5A]">
          ご担当者名 <span className="text-[#D85A30]">*</span>
        </label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          required
          className="w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5F5E5A]">
          メールアドレス <span className="text-[#D85A30]">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5F5E5A]">
          電話番号(任意)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5F5E5A]">
          ご相談内容 <span className="text-[#D85A30]">*</span>
        </label>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
        >
          {INTEREST_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#5F5E5A]">
          詳細(任意)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="募集職種、勤務地、待遇など、分かる範囲で教えてください"
          className="h-20 w-full resize-none rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-[#D85A30] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "sending" ? "送信中..." : "この内容で問い合わせる"}
      </button>
      {status === "error" && (
        <p className="text-xs text-[#D85A30]">
          送信に失敗しました。もう一度お試しください。
        </p>
      )}
    </form>
  );
}
