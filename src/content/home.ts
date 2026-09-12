export const homeContent = {
  hero: {
    eyebrow: "Trusted by parents. Loved by children.",
    heading: "You know your child best.",
    script: "We're here to support that instinct.",
    subhead:
      "NeuroNest is a science-backed companion that helps you {understand}, {nurture}, and {empower} your child's unique potential — starting with a short video of an everyday moment.",
    ctaPrimary: { label: "Take the First Step", href: "/for-parents" },
    ctaSecondary: { label: "I'm a clinician", href: "/for-clinicians" },
    badges: [
      { key: "understand", label: "Understand", icon: "brain" },
      { key: "nurture", label: "Nurture", icon: "hands" },
      { key: "empower", label: "Empower", icon: "sprout" },
    ],
    quote: "The right support today shapes a confident tomorrow.",
    imageAlt: "A parent and child reading together in a cosy woven nest.",
  },

  empathy: {
    heading: "Every child develops differently.",
    script: "That's normal. That's beautiful.",
    body: [
      "If you're waiting for an NHS assessment, you already know the wait can stretch into months — sometimes longer. That wait doesn't have to be empty time.",
      "NeuroNest gives you a personalised starting point now: a plan built around how your child's brain learns, reviewed by a real person, so you're doing something useful with today while the referral works its way through the system.",
    ],
    pullQuote:
      "We don't ask what's wrong with your child. We ask: how does this child's brain learn best?",
    pullQuoteLabel: "OUR GUIDING PRINCIPLE",
  },

  features: {
    script: "FOUNDATIONAL CARE",
    heading: "Designed with Care. Rooted in Science.",
    items: [
      {
        icon: "brain",
        tint: "coral" as const,
        title: "Science-Backed",
        body: "Every plan is rooted in neuroscience, child-development research, and recognised clinical guidance, including NICE's early-support recommendations.",
      },
      {
        icon: "shield",
        tint: "sage" as const,
        title: "Trusted Guidance",
        body: "Built by people with real clinical and developmental expertise, and every plan is reviewed by a professional before it reaches you.",
      },
      {
        icon: "person",
        tint: "gold" as const,
        title: "Made for Real Life",
        body: "Practical, personalised, and quick to act on — because parenting doesn't leave room for anything complicated.",
      },
      {
        icon: "sprout",
        tint: "coral" as const,
        title: "For Every Child",
        body: "Built for children with ADHD, Autism, and other neurodevelopmental differences — starting from their strengths, not a checklist of deficits.",
      },
    ],
  },

  trust: {
    label: "Trust & Ethics",
    heading: "Your family's privacy and dignity stay yours.",
    body: "We know you are trusting us with something tender: video glimpses into your private home and your honest parental concerns. We treat developmental records with clinical safeguarding rigor:",
    items: [
      "UK GDPR & Caldicott Principles Compliant",
      "End-to-End Encrypted UK Data Custody",
      "Zero Data Shared with Advertisers or Third Parties",
      "Instant 1-Click Video Deletion Anytime",
    ],
    cta: {
      label: "Read our Clinical & Privacy Governance",
      href: "/privacy",
    },
  },

  closing: {
    script: "You don't have to have all the answers.",
    heading:
      "You just have to take the first step. We'll be here for the rest of the journey.",
    items: [
      {
        icon: "heart",
        title: "A caring community",
        body: "Connect with other parents who get it, without judgment.",
      },
      {
        icon: "chat",
        title: "Expert support when you need it",
        body: "Real answers from people who care, not just an FAQ page.",
      },
      {
        icon: "lock",
        title: "Private and safe, always",
        body: "Your child's data is handled with the same care you'd want for them.",
      },
    ],
    ctaCard: {
      title: "Join thousands of parents nurturing brighter futures.",
      cta: { label: "Join the Parent Waitlist", href: "/for-parents" },
    },
  },
};
