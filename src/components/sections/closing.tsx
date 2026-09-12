import React from "react";
import Image from "next/image";
import { Heart, MessageCircle, Lock } from "lucide-react";
import { homeContent } from "@/content/home";
import { IconBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function Closing() {
  const { closing } = homeContent;

  const getItemIcon = (iconName: string) => {
    switch (iconName) {
      case "heart":
        return <Heart size={18} aria-hidden="true" />;
      case "chat":
        return <MessageCircle size={18} aria-hidden="true" />;
      case "lock":
        return <Lock size={18} aria-hidden="true" />;
      default:
        return <Heart size={18} aria-hidden="true" />;
    }
  };

  return (
    <section className="closing" aria-labelledby="closing-heading">
      <Image
        className="closing__branches"
        src="/assets/hero-nest.png"
        alt=""
        width={300}
        height={300}
        aria-hidden="true"
      />
      <div className="container closing__inner">
        <MotionReveal className="closing__intro">
          <p className="script-line script-line--sm">{closing.script}</p>
          <h2 id="closing-heading">{closing.heading}</h2>

          <ul className="closing__items">
            {closing.items.map((item) => (
              <li key={item.title} className="closing__item">
                <IconBadge
                  tint="coral"
                  icon={getItemIcon(item.icon)}
                />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </MotionReveal>

        <MotionReveal delay={0.2} className="closing__cta-wrap">
          <Card variant="cta">
            <p className="closing__cta-title">{closing.ctaCard.title}</p>
            <Button
              href={closing.ctaCard.cta.href}
              variant="primary"
              pill
            >
              {closing.ctaCard.cta.label}
            </Button>
          </Card>
        </MotionReveal>
      </div>
    </section>
  );
}
