import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/sections/hero";
import { Empathy } from "@/components/sections/empathy";
import { FeatureGrid } from "@/components/sections/feature-grid";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Clinicians } from "@/components/sections/clinicians";
import { Trust } from "@/components/sections/trust";
import { Closing } from "@/components/sections/closing";
import { LeadForms } from "@/components/sections/lead-forms";
import { Faq } from "@/components/sections/faq";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Empathy />
        <FeatureGrid />
        <HowItWorks />
        <Clinicians />
        <Trust />
        <Closing />
        <LeadForms />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
