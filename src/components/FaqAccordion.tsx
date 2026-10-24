"use client";

import { useState } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className={`faq-card ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="faq-question-btn"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <span className="faq-icon">{isOpen ? "−" : "+"}</span>
            </button>
            <div className="faq-answer-collapse">
              <div className="faq-answer-body">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
