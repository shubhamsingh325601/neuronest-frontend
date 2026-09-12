"use client";

import React from "react";
import Image from "next/image";
import {
  Brain,
  ShieldCheck,
  HeartHandshake,
  UsersRound,
  Quote,
  Sparkles,
} from "lucide-react";
import { howItWorksContent } from "@/content/how-it-works";
import { IconBadge } from "@/components/ui/badge";
import { PhoneMock } from "@/components/interactive/phone-mock";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function HowItWorks() {
  const howItWorks = howItWorksContent;

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "brain":
        return <Brain size={18} aria-hidden="true" />;
      case "shield":
        return <ShieldCheck size={18} aria-hidden="true" />;
      case "hands":
        return <HeartHandshake size={18} aria-hidden="true" />;
      case "people":
        return <UsersRound size={18} aria-hidden="true" />;
      default:
        return <Sparkles size={18} aria-hidden="true" />;
    }
  };

  return (
    <section
      className="how-it-works py-16 md:py-24"
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container how-it-works__grid">
        <div className="how-it-works__steps">
          <MotionReveal>
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FBE3DA] text-[#E2775B]">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-serif font-semibold text-[#332C26] m-0">
                {howItWorks.heading}
              </h2>
            </div>
          </MotionReveal>

          {/* Connected Steps Timeline */}
          <div className="relative flex flex-col">
            {howItWorks.steps.map((step, index) => {
              const isLast = index === howItWorks.steps.length - 1;
              return (
                <MotionReveal
                  key={step.title}
                  delay={0.1 * index}
                  className="relative flex items-start gap-4 md:gap-6 group"
                >
                  {/* Left Spine with Number Node and Connecting Line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border-2 border-[#E2775B] text-[#E2775B] font-semibold flex items-center justify-center shadow-sm z-10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#E2775B] group-hover:text-white">
                      0{step.number}
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 min-h-[70px] md:min-h-[85px] border-l-2 border-dashed border-[#E2775B]/40 my-1 transition-colors duration-300 group-hover:border-[#E2775B]"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Right Step Content */}
                  <div className="pb-8 md:pb-10 pt-1 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <IconBadge
                        tint={step.tint}
                        icon={getStepIcon(step.icon)}
                      />
                      <h3 className="text-xl font-serif font-semibold text-[#332C26]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-[#6E6259] text-sm md:text-base leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </MotionReveal>
              );
            })}
          </div>
        </div>

        {/* Right Phone Mock & Parent Testimonial */}
        <div className="how-it-works__mock" aria-hidden="true">
          <PhoneMock />

          <blockquote className="testimonial-card" id="testimonial-card">
            <Quote className="icon icon--quote text-[#E2775B]" size={24} aria-hidden="true" />
            <p className="testimonial-card__quote">
              “{howItWorks.testimonial.quote}”
            </p>
            <footer className="testimonial-card__attribution">
              <Image
                className="testimonial-card__photo"
                src="/assets/testimonial-placeholder.svg"
                alt=""
                width={44}
                height={44}
              />
              <span>
                <strong>{howItWorks.testimonial.name}</strong>,{" "}
                {howItWorks.testimonial.context}
              </span>
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
