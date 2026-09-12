"use client";

import React, { useState } from "react";
import { HelpCircle, Search, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Accordion } from "@/components/ui/accordion";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { faqContent } from "@/content/faq";

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { hero, categories, items, supportBanner } = faqContent;

  const filteredFaqs = items.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <SiteHeader />
      <FaqJsonLd items={items} />
      <main id="main" className="pt-28 pb-20">
        {/* Header */}
        <section className="py-12 md:py-16 bg-[#FCF6F0] border-b border-[#EBDFD3]/60">
          <Container>
            <MotionReveal className="max-w-2xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FBE3DA] text-[#C85F45] mb-4">
                <HelpCircle size={14} />
                <span>{hero.badge}</span>
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#332C26] mb-4">
                {hero.heading}
              </h1>
              <p className="text-[#6E6259] text-base md:text-lg">
                {hero.subhead}
              </p>

              {/* Search Bar */}
              <div className="relative mt-8 max-w-md mx-auto">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={hero.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full border border-[#EBDFD3] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E2775B]/20 focus:border-[#E2775B] shadow-xs"
                />
              </div>
            </MotionReveal>
          </Container>
        </section>

        {/* Category Pills & Accordion List */}
        <section className="py-12 md:py-16">
          <Container>
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[#E2775B] !text-white shadow-xs"
                      : "bg-[#FCF6F0] text-[#6E6259] hover:bg-[#FBE3DA] hover:text-[#C85F45]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Questions Accordion */}
            {filteredFaqs.length > 0 ? (
              <Accordion items={filteredFaqs} />
            ) : (
              <div className="text-center py-12 text-[#6E6259]">
                <p className="text-lg font-serif">No questions found matching your search.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-3 text-sm text-[#C85F45] font-semibold underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Bottom Contact Help */}
            <div className="mt-16 text-center bg-[#FCF6F0] rounded-3xl p-8 max-w-xl mx-auto border border-[#EBDFD3]">
              <h3 className="text-xl font-serif font-semibold text-[#332C26] mb-2">
                {supportBanner.heading}
              </h3>
              <p className="text-[#6E6259] text-sm mb-4">
                {supportBanner.body}
              </p>
              <a
                href={supportBanner.cta.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#C85F45] hover:text-[#E2775B]"
              >
                <span>{supportBanner.cta.label}</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
