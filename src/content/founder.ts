// Public founder copy, drawn from docs/NeuroNest Founder Profile.docx.
// Deliberately left out: BPS member number, personal email, phone, home address,
// legal/tax placeholders and the unfinished services list. founder.test.ts guards this.
export const founderContent = {
  eyebrow: "Meet the founder",
  heading: "Why I built NeuroNest",

  name: "Vanshika Bharti",
  role: "Founder & Product Head",

  image: {
    src: "/assets/founderimg.jpeg",
    alt: "Vanshika Bharti, founder of NeuroNest, smiling with her arms folded in a cream tweed jacket.",
    width: 1200,
    height: 1600,
  },

  // Floating pill over the photo.
  pill: { label: "BPS Member", icon: "shield" },

  credentials: [
    { key: "product", label: "Product Specialist", icon: "layers" },
    {
      key: "degree",
      label: "MSc Applied Neuropsychology, University of Bristol",
      icon: "graduation",
    },
    {
      key: "nhs",
      label: "Activity Coordinator, South London and Maudsley NHS Foundation Trust",
      icon: "stethoscope",
    },
    { key: "research", label: "Research in cognitive assessment", icon: "microscope" },
    { key: "community", label: "Led a community centre", icon: "people" },
  ],

  story: [
    "Vanshika is a neuropsychology graduate and a member of the British Psychological Society. She has spent her career working alongside people with complex neurological, developmental and mental health needs, in clinical, community and research settings across the UK and India. At NeuroNest she leads product.",
    "Children with Autism and ADHD often need many different kinds of support, and families can end up piecing that support together on their own. NeuroNest was founded to bring it together in one place, so that a child can be supported in every part of growing up without missing out on the joy of being a child.",
  ],

  quote: {
    text: "Every child deserves to be a child. I have sat beside children who were told, in a hundred quiet ways, that they were too much, too loud, too different. I have watched parents carry that weight alone, searching for help in many places and rarely finding it in one. And I have seen how a child’s whole face changes when someone finally understands them. … Being different should never cost a child their childhood.",
    attribution: "Vanshika Bharti, Founder, NeuroNest",
  },

  vision: {
    label: "Our vision",
    text: "An integrated platform where one child receives every kind of support they need to grow differently, and to enjoy a good, memorable childhood. No child should lose their childhood just because they are different.",
  },
  mission: {
    label: "Our mission",
    text: "For every neurodiverse child across the world to have a better childhood and to be well equipped with the support they need to be self-supported in adulthood.",
  },

  links: [
    { label: "See how it works", href: "/how-it-works" },
    { label: "Meet our clinical network", href: "#clinicians" },
  ],

  // Facts shown on the page, reused for Person structured data.
  person: {
    jobTitle: "Founder & Product Head",
    alumniOf: "University of Bristol",
    memberOf: "British Psychological Society",
  },
};
