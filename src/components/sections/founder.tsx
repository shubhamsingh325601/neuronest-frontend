import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  GraduationCap,
  Layers,
  Microscope,
  Quote,
  ShieldCheck,
  Stethoscope,
  Target,
  UsersRound,
} from "lucide-react";
import { founderContent } from "@/content/founder";
import { Container } from "@/components/ui/container";
import { IconBadge } from "@/components/ui/badge";
import { MotionReveal } from "@/components/interactive/motion-reveal";

const ICONS: Record<string, React.ReactNode> = {
  shield: <ShieldCheck size={16} aria-hidden="true" />,
  layers: <Layers size={16} aria-hidden="true" />,
  graduation: <GraduationCap size={16} aria-hidden="true" />,
  stethoscope: <Stethoscope size={16} aria-hidden="true" />,
  microscope: <Microscope size={16} aria-hidden="true" />,
  people: <UsersRound size={16} aria-hidden="true" />,
};

export function Founder() {
  const { image, pill, credentials, story, quote, vision, mission, links } =
    founderContent;

  return (
    <section className="founder" id="founder" aria-labelledby="founder-heading">
      <Container>
        <div className="founder__grid">
          <MotionReveal className="founder__visual">
            <div className="founder__art">
              <div className="founder__frame">
                <Image
                  className="founder__photo"
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(min-width: 64rem) 416px, 80vw"
                />
              </div>
              <span className="founder__pill">
                <span className="founder__pill-icon">{ICONS[pill.icon]}</span>
                <span>{pill.label}</span>
              </span>
            </div>
          </MotionReveal>

          <MotionReveal className="founder__content">
            <p className="script-line script-line--sm">{founderContent.eyebrow}</p>
            <h2 id="founder-heading">{founderContent.heading}</h2>

            <p className="founder__name">{founderContent.name}</p>
            <p className="founder__role">{founderContent.role}</p>

            <ul className="founder__chips" aria-label="Background">
              {credentials.map((c) => (
                <li key={c.key} className="founder__chip">
                  {ICONS[c.icon]}
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>

            <div className="founder__story">
              {story.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </MotionReveal>
        </div>

        <MotionReveal>
          <figure className="founder__quote">
            <Quote className="founder__quote-mark" size={28} aria-hidden="true" />
            <blockquote>
              <p>{quote.text}</p>
            </blockquote>
            <figcaption>— {quote.attribution}</figcaption>
          </figure>
        </MotionReveal>

        <MotionReveal delay={0.1} className="founder__aims">
          <div className="founder__aim">
            <IconBadge tint="coral" icon={<Eye size={18} aria-hidden="true" />} />
            <div>
              <h3>{vision.label}</h3>
              <p>{vision.text}</p>
            </div>
          </div>
          <div className="founder__aim">
            <IconBadge tint="sage" icon={<Target size={18} aria-hidden="true" />} />
            <div>
              <h3>{mission.label}</h3>
              <p>{mission.text}</p>
            </div>
          </div>
        </MotionReveal>

        <nav className="founder__links" aria-label="Learn more">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="founder__link">
              <span>{link.label}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </Container>
    </section>
  );
}
