import React from "react";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Brain, HeartHandshake, Sprout } from "lucide-react";
import { homeContent } from "@/content/home";
import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function Hero() {
  const { hero } = homeContent;

  const renderSubhead = (text: string) => {
    const parts = text.split(/(\{understand\}|\{nurture\}|\{empower\})/g);
    return parts.map((part, index) => {
      if (part === "{understand}") {
        return (
          <span key={index} className="hl">
            understand
          </span>
        );
      }
      if (part === "{nurture}") {
        return (
          <span key={index} className="hl">
            nurture
          </span>
        );
      }
      if (part === "{empower}") {
        return (
          <span key={index} className="hl">
            empower
          </span>
        );
      }
      return part;
    });
  };

  const getPillIcon = (iconName: string) => {
    switch (iconName) {
      case "brain":
        return <Brain size={16} aria-hidden="true" />;
      case "hands":
        return <HeartHandshake size={16} aria-hidden="true" />;
      case "sprout":
        return <Sprout size={16} aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <section className="hero" id="hero" aria-labelledby="hero-heading">
      <div className="container hero__inner">
        <MotionReveal className="hero__content">
          <h1 id="hero-heading">{hero.heading}</h1>
          <p className="script-line hero__script">{hero.script}</p>

          <p className="hero__subhead">{renderSubhead(hero.subhead)}</p>

          <div className="hero__actions">
            <Button
              href={hero.ctaPrimary.href}
              variant="primary"
              size="lg"
              pill
              rightIcon={<ArrowRight size={18} className="icon" aria-hidden="true" />}
            >
              {hero.ctaPrimary.label}
            </Button>
            <Button href={hero.ctaSecondary.href} variant="link">
              {hero.ctaSecondary.label}
            </Button>
          </div>

          <p className="hero__trust">
            <ShieldCheck size={18} className="icon" aria-hidden="true" />
            <span>{hero.eyebrow}</span>
          </p>
        </MotionReveal>

        <MotionReveal delay={0.2} className="hero__visual">
          <div className="hero__art">
            <Image
              className="hero__image"
              src="/assets/footer-img.jpg"
              alt={hero.imageAlt}
              width={1200}
              height={1104}
              priority
            />

            <ul className="hero__pills" aria-label="What NeuroNest helps you do">
              {hero.badges.map((badge) => (
                <li
                  key={badge.key}
                  className={`hero-pill hero-pill--${badge.key}`}
                >
                  <span className="hero-pill__icon">
                    {getPillIcon(badge.icon)}
                  </span>
                  <span>{badge.label}</span>
                </li>
              ))}
            </ul>

            <blockquote className="hero-quote">
              <p className="hero-quote__text">&ldquo;{hero.quote}&rdquo;</p>
            </blockquote>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
