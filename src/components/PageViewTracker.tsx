"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "hahanavi_visitor_id";

function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const visitorId = getVisitorId();
    // LINEやXのアプリ内ブラウザ・短縮リンク経由だとdocument.referrerが送られないことが多いので、
    // リンクに付与している?fromパラメータで判定する(line-webhook/route.ts、XPostForm.tsx参照)
    const from = new URLSearchParams(window.location.search).get("from");
    const referrer =
      from === "line"
        ? "line-app-link"
        : from === "x"
          ? "x-app-link"
          : document.referrer || null;
    fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, visitorId, referrer }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
