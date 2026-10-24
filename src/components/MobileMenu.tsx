"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { CartLink } from "@/components/CartLink";

type Props = {
  accountHref: string;
  accountLabel: string;
  logoutAction?: (formData: FormData) => void | Promise<void>;
};

const links = [
  ["Каталог", "/catalog"],
  ["3D-печать на заказ", "/3d-pechat-na-zakaz"],
  ["Как это работает", "/#process"],
  ["Контакты", "/contacts"],
] as const;

export function MobileMenu({ accountHref, accountLabel, logoutAction }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="mobile-menu">
      <button
        className="menu-trigger"
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-controls="mobile-navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      {mounted && createPortal(<div
        className="mobile-drawer"
        data-open={open}
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
      >
        <button
          className="mobile-drawer-backdrop"
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
        <aside className="mobile-drawer-panel" id="mobile-navigation" aria-label="Навигация">
          <div className="mobile-drawer-head">
            <span className="logo">FORM<i>3D</i></span>
            <button className="icon-button menu-close" type="button" onClick={() => setOpen(false)} aria-label="Закрыть меню">×</button>
          </div>
          <nav className="mobile-nav-links">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}<span>→</span></Link>)}
          </nav>
          <div className="mobile-account-card">
            <span>Личный кабинет</span>
            <Link href={accountHref} onClick={() => setOpen(false)}><b>{accountLabel}</b><small>Заказы и статус оплаты</small></Link>
          </div>
          <div className="mobile-menu-actions">
            <CartLink />
            {logoutAction && <form action={logoutAction}><button className="mobile-logout" type="submit">Выйти из аккаунта</button></form>}
          </div>
        </aside>
      </div>, document.body)}
    </div>
  );
}
