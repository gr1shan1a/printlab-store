"use client";

import { useEffect } from "react";

export function HomeVisitTracker() {
  useEffect(() => {
    void fetch("/api/analytics/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      keepalive: true,
    });
  }, []);

  return null;
}
