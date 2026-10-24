"use client";

import { useEffect } from "react";

/** Keeps the opaque, HTTP-only session cookie alive while the visitor is active. */
export function SessionKeeper() {
  useEffect(() => {
    const refresh = () => fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" }).catch(() => undefined);
    refresh();
    const interval = window.setInterval(refresh, 15 * 60_000);
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  return null;
}
