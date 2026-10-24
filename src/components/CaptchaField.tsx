"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export function CaptchaField({ resetKey = 0, onToken }: { resetKey?: number; onToken?: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callback = useRef(onToken);
  callback.current = onToken;

  useEffect(() => {
    const mount = () => {
      if (!container.current || !window.turnstile || widgetId.current) return;
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: "light",
        size: "flexible",
        callback: (token: string) => { const input = container.current?.parentElement?.querySelector<HTMLInputElement>('[name="captchaToken"]'); if (input) input.value = token; callback.current?.(token); },
        "expired-callback": () => { const input = container.current?.parentElement?.querySelector<HTMLInputElement>('[name="captchaToken"]'); if (input) input.value = ""; callback.current?.(""); },
        "error-callback": () => { const input = container.current?.parentElement?.querySelector<HTMLInputElement>('[name="captchaToken"]'); if (input) input.value = ""; callback.current?.(""); },
      });
    };
    mount();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey && widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  return <div className="field captcha-field">
    <label>Проверка Cloudflare</label>
    {!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? <div className="notice">Проверка временно недоступна</div> : <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => {
        if (!container.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(container.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!, theme: "light", size: "flexible",
          callback: (token: string) => { const input = container.current?.parentElement?.querySelector<HTMLInputElement>('[name="captchaToken"]'); if (input) input.value = token; callback.current?.(token); },
          "expired-callback": () => { const input = container.current?.parentElement?.querySelector<HTMLInputElement>('[name="captchaToken"]'); if (input) input.value = ""; callback.current?.(""); }, "error-callback": () => { const input = container.current?.parentElement?.querySelector<HTMLInputElement>('[name="captchaToken"]'); if (input) input.value = ""; callback.current?.(""); },
        });
      }} />
      <div ref={container} />
      <input type="hidden" name="captchaToken" />
    </>}
  </div>;
}
