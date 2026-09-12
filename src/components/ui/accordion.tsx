"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default for immediate preview

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className={cn("space-y-3 max-w-3xl mx-auto", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={cn(
              "rounded-2xl border transition-all duration-300 overflow-hidden",
              isOpen
                ? "bg-white border-[#E2775B]/40 shadow-sm"
                : "bg-white/80 border-[#EBDFD3] hover:border-[#E2775B]/30 hover:bg-white"
            )}
          >
            <button
              type="button"
              className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2775B]/40"
              aria-expanded={isOpen}
              onClick={() => toggle(index)}
            >
              <span className="flex items-center gap-3 text-base md:text-lg font-serif font-semibold text-[#332C26]">
                <HelpCircle size={18} className="text-[#E2775B] flex-shrink-0" />
                <span>{item.question}</span>
              </span>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300",
                  isOpen
                    ? "rotate-180 bg-[#FBE3DA] text-[#C85F45]"
                    : "bg-[#FCF6F0] text-[#6E6259]"
                )}
              >
                <ChevronDown size={18} aria-hidden="true" />
              </div>
            </button>
            <div
              className={cn(
                "transition-all duration-300 ease-in-out px-6",
                isOpen
                  ? "max-h-96 opacity-100 pb-5 pt-1"
                  : "max-h-0 opacity-0 pb-0 pt-0 overflow-hidden pointer-events-none"
              )}
            >
              <p className="text-sm md:text-base text-[#6E6259] leading-relaxed pl-7">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
