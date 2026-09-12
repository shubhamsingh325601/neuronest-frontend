export const forCliniciansContent = {
  hero: {
    badge: "Clinical Collaboration Network",
    heading: "Empowering Families Together Before the Clinical Void.",
    subhead:
      "NeuroNest brings together NHS-experienced speech therapists, occupational therapists, and psychologists to provide early intervention while statutory assessments are pending.",
    cta: {
      label: "Register Clinical Interest",
      href: "#intake-form",
    },
    imageAlt: "Clinician conducting a pediatric developmental observation session",
  },

  overview: {
    tag: "Multidisciplinary Excellence",
    heading: "Join the clinical team behind NeuroNest.",
    body: "We're building a network of speech and language therapists, occupational therapists, psychologists, and paediatric specialists to review plans and support families. Access is admin-managed and vetted — this isn't an open sign-up. If you'd like to be considered as we onboard our first cohort ahead of launch, register your interest below and our clinical lead will be in touch.",
    badges: [
      { label: "HCPC Registered Only", icon: "♧" },
      { label: "NHS-Experienced Clinicians", icon: "⊞" },
      { label: "RCPCH-Aligned Frameworks", icon: "♧" },
    ],
  },

  standards: [
    {
      title: "HCPC & Professional Registration",
      desc: "All clinical reviewers must hold active registration with the HCPC, BPS, or equivalent UK statutory regulator.",
    },
    {
      title: "NHS Pediatric Experience",
      desc: "Minimum 3 years of clinical practice in NHS child development teams, CAMHS, or pediatric neurodiversity services.",
    },
    {
      title: "NICE Guideline Alignment",
      desc: "Assessment frameworks and developmental recommendations conform strictly to NICE CG128, CG170, and NG87 standards.",
    },
    {
      title: "Flexible Remote Caseload",
      desc: "Review video observations asynchronously with structured, evidence-based rubrics. Ideal for portfolio careers.",
    },
  ],

  scopeOfPractice: [
    {
      specialty: "Speech & Language Therapy",
      focus: "Pragmatic communication, non-verbal signaling, gesture usage, and communicative intent during joint attention.",
    },
    {
      specialty: "Occupational Therapy",
      focus: "Sensory processing thresholds, vestibular/proprioceptive regulation, fine motor praxis, and self-care autonomy.",
    },
    {
      specialty: "Child & Educational Psychology",
      focus: "Executive functioning, emotional co-regulation, transition friction reduction, and strengths-focused behavioral profiles.",
    },
    {
      specialty: "Developmental Paediatrics",
      focus: "Milestone trajectories, neurodevelopmental differential screening, and holistic child wellness oversight.",
    },
  ],

  testimonial: {
    name: "Dr. Elena Vance, DClinPsy",
    position: "Lead Pediatric Neuropsychologist",
    quote:
      "“NeuroNest bridges the distressing void parents experience while awaiting statutory assessment. By reviewing natural video moments rather than clinical lab trials, we see the authentic child.”",
    avatar: "/assets/neuronest-avatar.png",
  },

  form: {
    badge: "Vetted Clinical Cohort",
    heading: "Register Your Clinical Interest",
    body: "Tell us a little about your clinical practice and registration. Our clinical lead reviews all credentials and will reach out to schedule an introductory dialogue.",
    fields: {
      name: {
        label: "Full Name & Credentials",
        placeholder: "Dr. Jordan Lee, MRCPCH / HCPC",
      },
      email: {
        label: "Professional Email",
        placeholder: "jordan.lee@nhs.net or clinic address",
      },
      specialty: {
        label: "Primary Area of Clinical Practice",
        options: [
          "Speech & Language Therapy (HCPC)",
          "Occupational Therapy & Sensory Integration (HCPC)",
          "Clinical / Educational Psychology (HCPC / BPS)",
          "Paediatrics & Child Health (RCPCH / GMC)",
          "Neurodevelopmental Specialist Nurse",
          "Special Educational Needs Coordinator (SENCO)",
        ],
      },
      experience: {
        label: "Years of Post-Qualification Experience",
        options: [
          "3–5 years",
          "5–10 years",
          "10+ years",
        ],
      },
    },
    submit: "Register Clinical Interest",
    pendingText: "Submitting details...",
    success: "Thank you for registering. Our clinical governance lead will review your details and contact you.",
  },
};
