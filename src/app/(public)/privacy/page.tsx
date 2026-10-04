import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, Trash2, ArrowLeft } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { privacyContent } from "@/content/privacy";

export const metadata = createMetadata({
  title: "Trust, Ethics & Data Privacy — NeuroNest UK",
  description:
    "Learn about our clinical safeguarding standards, UK GDPR compliance, Caldicott Principles, and how we protect your family's videos and developmental records.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const { hero, pillars, safeguardingNotice, sections } = privacyContent;

  const pillarIcons: React.ReactNode[] = [
    <ShieldCheck key="sc" className="text-[#C85F45]" size={24} />,
    <Lock key="l" className="text-[#C85F45]" size={24} />,
    <EyeOff key="eo" className="text-[#C85F45]" size={24} />,
    <Trash2 key="t" className="text-[#C85F45]" size={24} />,
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 pb-20">
        {/* Header */}
        <section className="py-12 md:py-16 bg-[#FCF6F0] border-b border-[#EBDFD3]/60">
          <Container>
            <MotionReveal className="max-w-3xl">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#6E6259] hover:text-[#332C26] mb-4"
              >
                <ArrowLeft size={14} /> Back to Home
              </Link>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FBE3DA] text-[#C85F45] mb-4 ml-4">
                <ShieldCheck size={14} />
                <span>{hero.badge}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#332C26] mb-4">
                {hero.heading}
              </h1>
              <p className="text-[#6E6259] text-base md:text-xl leading-relaxed">
                {hero.subhead}
              </p>
              <p className="text-xs text-[#8A7C73] mt-3">{hero.lastUpdated}</p>
            </MotionReveal>
          </Container>
        </section>

        {/* Safeguarding Alert Banner */}
        <section className="py-8 bg-[#FAF5EE] border-b border-[#EBDFD3]/60">
          <Container>
            <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white border border-[#EBDFD3] shadow-xs">
              <h2 className="text-lg font-serif font-semibold text-[#332C26] mb-2">
                {safeguardingNotice.heading}
              </h2>
              <p className="text-[#6E6259] text-sm leading-relaxed">
                {safeguardingNotice.body}
              </p>
            </div>
          </Container>
        </section>

        {/* Core Principles */}
        <section className="py-16 md:py-24 bg-white">
          <Container>
            <div className="max-w-3xl mx-auto space-y-12">
              {pillars.map((pillar, idx) => (
                <div key={idx}>
                  <h3 className="text-2xl font-serif font-semibold text-[#332C26] mb-4 flex items-center gap-3">
                    {pillarIcons[idx % pillarIcons.length]}
                    <span>{`${idx + 1}. ${pillar.title}`}</span>
                  </h3>
                  <p className="text-[#6E6259] leading-relaxed text-sm md:text-base">
                    {pillar.description}
                  </p>
                </div>
              ))}

              <div className="pt-8 border-t border-[#EBDFD3] space-y-8">
                {sections.map((sec, idx) => (
                  <div key={idx}>
                    <h4 className="text-lg font-serif font-semibold text-[#332C26] mb-2">
                      {sec.heading}
                    </h4>
                    <p className="text-sm text-[#6E6259] leading-relaxed">
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
