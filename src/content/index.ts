import { siteConfig } from "./site";
import { homeContent } from "./home";
import { howItWorksContent } from "./how-it-works";
import { forParentsContent } from "./for-parents";
import { forCliniciansContent } from "./for-clinicians";
import { faqContent } from "./faq";
import { privacyContent } from "./privacy";
import { founderContent } from "./founder";

export {
  founderContent,
  siteConfig,
  homeContent,
  howItWorksContent,
  forParentsContent,
  forCliniciansContent,
  faqContent,
  privacyContent,
};

// Unified backward-compatible siteContent object matching legacy structure
export const siteContent = {
  meta: siteConfig.meta,
  brand: siteConfig.brand,
  nav: siteConfig.nav,
  hero: homeContent.hero,
  empathy: homeContent.empathy,
  features: homeContent.features,
  howItWorks: {
    heading: howItWorksContent.heading,
    steps: howItWorksContent.steps,
    phoneMock: howItWorksContent.phoneMock,
    testimonial: howItWorksContent.testimonial,
  },
  clinicians: {
    tag: forCliniciansContent.overview.tag,
    heading: forCliniciansContent.overview.heading,
    body: forCliniciansContent.overview.body,
    cta: {
      label: "Register Clinical Interest",
      href: "/for-clinicians#intake-form",
    },
    badges: forCliniciansContent.overview.badges,
    testimonial: forCliniciansContent.testimonial,
  },
  trust: homeContent.trust,
  closing: homeContent.closing,
  forms: {
    script: "EARLY COHORT ENROLLMENT",
    heading: "Take Your Next Step with Us",
    parent: {
      heading: forParentsContent.form.heading,
      body: forParentsContent.form.body,
      fields: {
        name: forParentsContent.form.fields.name,
        email: forParentsContent.form.fields.email,
        context: {
          label: forParentsContent.form.fields.concern.label,
          options: forParentsContent.form.fields.concern.options,
        },
      },
      submit: forParentsContent.form.submit,
      success: forParentsContent.form.success,
    },
    clinician: {
      heading: forCliniciansContent.form.heading,
      body: forCliniciansContent.form.body,
      fields: {
        name: forCliniciansContent.form.fields.name,
        email: forCliniciansContent.form.fields.email,
        context: {
          label: forCliniciansContent.form.fields.specialty.label,
          options: forCliniciansContent.form.fields.specialty.options,
        },
      },
      submit: forCliniciansContent.form.submit,
      success: forCliniciansContent.form.success,
    },
  },
  faq: {
    heading: faqContent.heading,
    items: faqContent.items,
  },
  footer: siteConfig.footer,
};
