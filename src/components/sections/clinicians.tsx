import React from "react";
import Image from "next/image";
import Link from "next/link";
import { forCliniciansContent } from "@/content/for-clinicians";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { MotionReveal } from "@/components/interactive/motion-reveal";

export function Clinicians() {
  const { overview, testimonial } = forCliniciansContent;

  return (
    <section className="neuronest-section" id="clinicians">
      <Container>
        <MotionReveal>
          <div className="neuronest-container">
            {/* LEFT CONTENT */}
            <div className="neuronest-content">
              <Badge variant="clinical-tag" icon="▧">
                {overview.tag}
              </Badge>

              <h2 className="neuronest-title">{overview.heading}</h2>

              <p className="neuronest-description">{overview.body}</p>

              <div className="neuronest-badges">
                {overview.badges.map((b) => (
                  <Badge
                    key={b.label}
                    variant="clinical"
                    icon={b.icon}
                  >
                    {b.label}
                  </Badge>
                ))}
              </div>

              <Link href="/for-clinicians" className="neuronest-button !text-white">
                <span>Explore Clinical Network</span>
                <span className="neuronest-arrow">&rarr;</span>
              </Link>
            </div>

            {/* RIGHT CONTENT */}
            <div className="neuronest-side">
              <Image
                src="/assets/clinical-image.png"
                alt="Clinical therapy session"
                className="neuronest-image"
                width={400}
                height={204}
              />

              <div className="neuronest-testimonial">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="neuronest-avatar"
                  width={48}
                  height={48}
                />

                <div className="neuronest-testimonial-content">
                  <div className="neuronest-name">
                    {testimonial.name}
                  </div>
                  <div className="neuronest-position">
                    {testimonial.position}
                  </div>
                  <div className="neuronest-quote">
                    {testimonial.quote}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MotionReveal>
      </Container>
    </section>
  );
}
