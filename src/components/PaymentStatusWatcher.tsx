"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentStatusWatcher() {
  const router = useRouter();
  useEffect(() => {
    let attempts = 0;
    const refresh = () => {
      attempts += 1;
      router.refresh();
    };
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [router]);
  return <p className="notice payment-checking">Проверяем подтверждение оплаты в YooKassa…</p>;
}
