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
    // LINEのトーク内リンクはdocument.referrerが送られないことが多いので、
    // LINE側で付与している?from=lineパラメータで判定する(line-webhook/route.ts参照)
    const fromLine = new URLSearchParams(window.location.search).get("from") === "line";
    const referrer = fromLine ? "line-app-link" : document.referrer || null;
    fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, visitorId, referrer }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
