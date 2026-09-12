import React from "react";
import { homeContent } from "@/content/home";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function Empathy() {
  const { empathy } = homeContent;

  return (
    <section className="empathy" id="empathy" aria-labelledby="empathy-heading">
      <Container>
        <MotionReveal>
          <SectionHeader
            script={empathy.script}
            title={empathy.heading}
          />
        </MotionReveal>

        <MotionReveal delay={0.1} className="empathy__body">
          {empathy.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </MotionReveal>

        <MotionReveal delay={0.2}>
          <blockquote className="pull-quote">
            <p>{empathy.pullQuote}</p>
            <span>{empathy.pullQuoteLabel}</span>
          </blockquote>
        </MotionReveal>
      </Container>
    </section>
  );
}
