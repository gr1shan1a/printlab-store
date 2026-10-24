"use client";

import { useEffect, useRef } from "react";

const values = ["Точная геометрия", "Первичное сырьё", "Проверка каждой детали", "Малые серии", "Печать по ссылке"];

export function ScrollValues() {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let previous = window.scrollY;
    let offset = 0;
    let frame = 0;
    const update = () => {
      const current = window.scrollY;
      const velocity = Math.max(-22, Math.min(22, current - previous));
      const loopWidth = track.current ? track.current.scrollWidth / 3 : 0;
      offset += velocity * 1.25;
      if (loopWidth) offset %= loopWidth;
      previous = current;
      if (track.current) track.current.style.transform = `translate3d(${offset}px, 0, 0)`;
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return <section className="values" aria-label="Принципы FORM3D"><div className="values-track" ref={track}>{[...values, ...values, ...values].map((value, index) => <span key={`${value}-${index}`}>{value}<i>✦</i></span>)}</div></section>;
}
