"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[#F1EFE8] p-6"
      >
        <p className="mb-4 text-lg font-medium">管理画面ログイン</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoFocus
          className="mb-3 w-full rounded-lg border border-[#D3D1C7] bg-white px-3 py-2 text-base outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#D85A30] px-4 py-2.5 text-base font-medium text-white disabled:opacity-50"
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
        {error && (
          <p className="mt-2 text-sm text-[#D85A30]">パスワードが違います</p>
        )}
      </form>
    </div>
  );
}
