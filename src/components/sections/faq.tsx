import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { faqContent } from "@/content/faq";
import { Container } from "@/components/ui/container";
import { Accordion } from "@/components/ui/accordion";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { FaqJsonLd } from "@/components/seo/json-ld";

export function Faq() {
  const { heading, items } = faqContent;

  return (
    <section className="faq py-16 md:py-24" id="faq" aria-labelledby="faq-heading">
      <FaqJsonLd items={items} />
      <Container>
        <MotionReveal className="text-center max-w-2xl mx-auto mb-10">
          <p className="script-line script-line--sm mb-2">Answers &amp; Clarity</p>
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-serif font-semibold text-[#332C26]">
            {heading}
          </h2>
        </MotionReveal>

        <MotionReveal delay={0.1}>
          <Accordion items={items} />
        </MotionReveal>

        <MotionReveal delay={0.2} className="text-center mt-10">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#C85F45] hover:text-[#E2775B] transition-colors"
          >
            <span>Browse our comprehensive FAQ knowledge base</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </MotionReveal>
      </Container>
    </section>
  );
}
