import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import { homeContent } from "@/content/home";
import { privacyContent } from "@/content/privacy";
import { Container } from "@/components/ui/container";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function Trust() {
  const { trust } = homeContent;
  const { pillars } = privacyContent;

  const pillarIcons: React.ReactNode[] = [
    <ShieldCheck key="sc" className="text-[#C85F45]" size={22} />,
    <Lock key="l" className="text-[#C85F45]" size={22} />,
    <EyeOff key="eo" className="text-[#C85F45]" size={22} />,
    <Trash2 key="t" className="text-[#C85F45]" size={22} />,
  ];

  return (
    <div className="trust-section py-12 md:py-16" id="trust">
      <Container>
        <MotionReveal>
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#EBDFD3]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FBE3DA] text-[#C85F45] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Lock size={22} aria-hidden="true" />
                </div>

                <div>
                  <span className="text-xs font-bold text-[#C85F45] uppercase tracking-wider block mb-1">
                    {trust.label}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#332C26] m-0">
                    {trust.heading}
                  </h2>
                </div>
              </div>

              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-[#C85F45] hover:text-[#E2775B] transition-colors"
              >
                <span>{trust.cta.label}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Description */}
            <p className="text-[#6E6259] text-base md:text-lg leading-relaxed max-w-3xl mb-10">
              {trust.body}
            </p>

            {/* 4 Interactive Compliance Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {pillars.map((pillar, index) => (
                <div
                  key={index}
                  className="bg-[#FCF6F0] p-5 rounded-2xl border border-[#EBDFD3]/60 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-[#E2775B]/30 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-xs group-hover:scale-105 transition-transform">
                      {pillarIcons[index % pillarIcons.length]}
                    </div>
                    <h3 className="text-sm font-semibold text-[#332C26] mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-[#6E8261] flex-shrink-0" />
                      <span>{pillar.title}</span>
                    </h3>
                  </div>
                  <p className="text-xs text-[#6E6259] leading-relaxed mt-2">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      </Container>
    </div>
  );
}
