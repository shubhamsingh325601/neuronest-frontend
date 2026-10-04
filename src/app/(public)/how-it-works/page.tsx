import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Video,
  FileCheck,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { HowItWorks } from "@/components/sections/how-it-works";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { howItWorksContent } from "@/content/how-it-works";

export const metadata = createMetadata({
  title: "How NeuroNest Works — Science-Backed Developmental Support",
  description:
    "Explore how NeuroNest works: from recording a simple 3-minute video of an everyday moment to receiving a personalised, human-reviewed developmental plan for your child.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  const { hero, breakdown, cta } = howItWorksContent;

  const iconMap: Record<string, React.ReactNode> = {
    video: <Video size={24} className="text-[#E2775B]" />,
    "file-check": <FileCheck size={24} className="text-[#6E8261]" />,
    "calendar-check": <CalendarCheck size={24} className="text-[#C4922E]" />,
    "trending-up": <TrendingUp size={24} className="text-[#E2775B]" />,
  };

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 pb-20">
        {/* Page Hero */}
        <section className="py-12 md:py-16 bg-[#FCF6F0] border-b border-[#EBDFD3]/60">
          <Container>
            <MotionReveal className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FBE3DA] text-[#C85F45] mb-4">
                <Sparkles size={14} />
                <span>{hero.badge}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#332C26] mb-4">
                {hero.heading}
              </h1>
              <p className="text-[#6E6259] text-base md:text-xl leading-relaxed">
                {hero.subhead}
              </p>
            </MotionReveal>
          </Container>
        </section>

        {/* Interactive Steps Section */}
        <HowItWorks />

        {/* In-Depth Process Grid */}
        <section className="py-16 md:py-24 bg-white border-t border-[#EBDFD3]/60">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="script-line script-line--sm mb-2">{breakdown.script}</p>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#332C26]">
                {breakdown.heading}
              </h2>
              <p className="text-[#6E6259] text-sm md:text-base mt-2">
                {breakdown.subhead}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {breakdown.phases.map((step, idx) => (
                <MotionReveal
                  key={step.title}
                  delay={0.1 * idx}
                  className="bg-[#FBF3EC] p-8 rounded-3xl border border-[#EBDFD3] flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C85F45]">
                        {step.phase}
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center">
                        {iconMap[step.iconType] || <Video size={24} className="text-[#E2775B]" />}
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif font-semibold text-[#332C26] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#6E6259] text-sm md:text-base leading-relaxed mb-6">
                      {step.summary}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-[#EBDFD3]/80">
                    {step.highlights.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-[#332C26]">
                        <CheckCircle2 size={16} className="text-[#6E8261] flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </MotionReveal>
              ))}
            </div>

            {/* Bottom CTA Card */}
            <MotionReveal delay={0.3} className="mt-16 text-center">
              <div className="bg-[#E2775B] text-white rounded-3xl p-8 md:p-12 max-w-3xl mx-auto shadow-md">
                <h3 className="text-2xl md:text-3xl font-serif font-semibold mb-3">
                  {cta.heading}
                </h3>
                <p className="text-[#FBE3DA] text-sm md:text-base mb-6 max-w-xl mx-auto">
                  {cta.body}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href={cta.primaryBtn.href}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white !text-[#C85F45] font-semibold text-sm hover:bg-[#FBE3DA] transition-colors"
                  >
                    <span>{cta.primaryBtn.label}</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={cta.secondaryBtn.href}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#C85F45] !text-white font-semibold text-sm hover:bg-[#A84B33] transition-colors"
                  >
                    <span>{cta.secondaryBtn.label}</span>
                  </Link>
                </div>
              </div>
            </MotionReveal>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
