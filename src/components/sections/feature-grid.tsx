import React from "react";
import { Brain, ShieldCheck, UserRound, Sprout } from "lucide-react";
import { homeContent } from "@/content/home";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { IconBadge } from "@/components/ui/badge";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function FeatureGrid() {
  const { features } = homeContent;

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case "brain":
        return <Brain size={20} aria-hidden="true" />;
      case "shield":
        return <ShieldCheck size={20} aria-hidden="true" />;
      case "person":
        return <UserRound size={20} aria-hidden="true" />;
      case "sprout":
        return <Sprout size={20} aria-hidden="true" />;
      default:
        return <Brain size={20} aria-hidden="true" />;
    }
  };

  return (
    <section className="feature_card" id="features">
      <Container>
        <MotionReveal>
          <SectionHeader
            script={features.script}
            title={features.heading}
          />
        </MotionReveal>

        <ul
          className="feature-grid"
          aria-label="Why parents choose NeuroNest"
        >
          {features.items.map((item, index) => (
            <MotionReveal
              key={item.title}
              delay={0.1 * index}
              className="feature-card"
            >
              <li>
                <IconBadge
                  tint={item.tint}
                  icon={getFeatureIcon(item.icon)}
                />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            </MotionReveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
