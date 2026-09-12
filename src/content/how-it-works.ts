export const howItWorksContent = {
  hero: {
    badge: "The NeuroNest Methodology",
    heading: "A Clear, Compassionate Path from Worry to Action.",
    subhead:
      "Waiting months for formal statutory assessments leaves families feeling stranded. Here is exactly how our science-backed companion bridges the gap.",
  },

  heading: "How NeuroNest Works",
  steps: [
    {
      number: 1,
      icon: "brain",
      tint: "coral" as const,
      title: "Understand",
      body: "Record a short video of an everyday moment — play or mealtime. It gives us a clear, real picture of how your child communicates, focuses, and responds, without a clinic visit.",
    },
    {
      number: 2,
      icon: "shield",
      tint: "sage" as const,
      title: "Personalise",
      body: "You get a plan built around your child's strengths and needs: daily micro-activities and simple scripts you can use straight away, like 'first-then' language for transitions.",
    },
    {
      number: 3,
      icon: "hands",
      tint: "gold" as const,
      title: "Take Action",
      body: "Follow guided activities and weekly tips that fit into moments you're already having — mealtimes, play, bedtime — so support happens in real life, not in a separate hour.",
    },
    {
      number: 4,
      icon: "people",
      tint: "coral" as const,
      title: "Track & Grow",
      body: "See your child's progress over time, and talk it through on a monthly call with a real person who adjusts the plan with you.",
    },
  ],

  phoneMock: {
    greeting: "Good morning, Mom",
    date: "Tuesday, 27 August",
    focusLabel: "Today's Focus",
    focusTitle: "Emotional Regulation",
    focusBody: "Helping your child manage big feelings with small steps.",
    progressLabel: "Your Child's Journey",
    progressValue: 72,
    progressNote: "You're doing amazing! Keep going.",
    recommendedLabel: "Recommended for You",
    recommendedTitle: "5-Minute Calm Corner Activity",
  },

  testimonial: {
    quote:
      "NeuroNest gave me the clarity I was searching for, and the confidence I didn't know I needed. It feels like someone is walking this journey with me.",
    name: "Amara",
    context: "mum of Theo (6)",
  },

  breakdown: {
    script: "Deep Dive",
    heading: "The 4 Clinical Milestones of Your Journey",
    subhead:
      "Every step is structured around clinical child-development science, giving you clear answers without clinical jargon.",
    phases: [
      {
        phase: "Phase 1: Observation",
        title: "Record an Everyday Moment",
        iconType: "video",
        tint: "coral" as const,
        summary:
          "No clinic visits or stressful assessments. Simply upload a 3- to 5-minute video of your child during natural play or mealtime from your smartphone.",
        highlights: [
          "Natural home environment reveals true child engagement",
          "Encrypted, private UK data custody under Caldicott principles",
          "Step-by-step guidance on which moments provide the clearest signals",
        ],
      },
      {
        phase: "Phase 2: Human Review",
        title: "Clinical Framework Review",
        iconType: "file-check",
        tint: "sage" as const,
        summary:
          "Every single submission is analyzed by HCPC-registered pediatric therapists and child development psychologists using recognized clinical frameworks.",
        highlights: [
          "100% human-reviewed by licensed UK clinicians",
          "Aligned with NICE early-support clinical guidelines",
          "Strengths-first neurodiversity model (ADHD, Autism, Sensory)",
        ],
      },
      {
        phase: "Phase 3: Actionable Plan",
        title: "Receive Your Personalised Plan",
        iconType: "calendar-check",
        tint: "gold" as const,
        summary:
          "Within 72 hours, receive daily micro-activities, clear transition scripts, and environment adjustments customized to how your child learns best.",
        highlights: [
          "Daily 5-minute actionable micro-routines for parents",
          "Ready-to-use verbal scripts for smooth daily transitions",
          "Visual schedule suggestions and sensory accommodation ideas",
        ],
      },
      {
        phase: "Phase 4: Ongoing Partnership",
        title: "Monthly Progress & Adjustments",
        iconType: "trending-up",
        tint: "coral" as const,
        summary:
          "Support doesn't stop after the report. Track milestones on your phone and meet monthly with our clinical team to adapt your plan as your child develops.",
        highlights: [
          "Visual progress tracking in the mobile companion",
          "Monthly video check-in with your assigned clinical specialist",
          "Dynamic plan adjustments matching newly achieved milestones",
        ],
      },
    ],
  },

  cta: {
    heading: "Ready to start your child's personalized plan?",
    body: "Join hundreds of parents moving from anxious waiting to calm, empowered action.",
    primaryBtn: {
      label: "Join the Parent Waitlist",
      href: "/for-parents",
    },
    secondaryBtn: {
      label: "Learn About Our Clinical Network",
      href: "/for-clinicians",
    },
  },
};
