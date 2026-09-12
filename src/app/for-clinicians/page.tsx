"use client";

import React, { useActionState } from "react";
import Image from "next/image";
import {
  Stethoscope,
  Award,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Briefcase,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { submitClinicianSignup } from "@/app/actions";
import { forCliniciansContent } from "@/content/for-clinicians";

export default function ForCliniciansPage() {
  const [state, formAction, isPending] = useActionState(
    submitClinicianSignup,
    {}
  );
  const { hero, standards, scopeOfPractice, testimonial, form } =
    forCliniciansContent;

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 pb-20">
        {/* Page Hero */}
        <section className="py-12 md:py-16 bg-[#E4EAE0]/40 border-b border-[#EBDFD3]/60">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <MotionReveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#E4EAE0] text-[#566A4B] mb-4">
                  <Stethoscope size={14} />
                  <span>{hero.badge}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#332C26] mb-4 leading-tight">
                  {hero.heading}
                </h1>
                <p className="text-[#6E6259] text-base md:text-lg leading-relaxed mb-6">
                  {hero.subhead}
                </p>
                <a
                  href={hero.cta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#6E8261] hover:bg-[#566A4B] !text-white font-semibold text-sm transition-colors"
                >
                  <span>{hero.cta.label}</span>
                  <ArrowDown size={16} />
                </a>
              </MotionReveal>

              <MotionReveal delay={0.2} className="relative">
                <div className="rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                  <Image
                    src="/assets/clinical-image.png"
                    alt={hero.imageAlt}
                    width={600}
                    height={380}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </MotionReveal>
            </div>
          </Container>
        </section>

        {/* Clinical Rigor Pillars */}
        <section className="py-16 md:py-24 bg-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="script-line script-line--sm mb-2">Governance &amp; Quality</p>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#332C26]">
                Our Clinical Vetting Standards
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {standards.map((std, i) => (
                <div
                  key={i}
                  className="bg-[#FCF6F0] p-6 rounded-2xl border border-[#EBDFD3] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#6E8261] mb-4 shadow-xs">
                      <Award size={20} />
                    </div>
                    <h3 className="text-base font-serif font-semibold text-[#332C26] mb-2">
                      {std.title}
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-[#6E6259] leading-relaxed">
                    {std.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Scope of Practice Grid */}
            <div className="mt-12 bg-[#FAF5EE] rounded-3xl p-8 md:p-12 border border-[#EBDFD3]">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white text-[#566A4B] border border-[#EBDFD3] mb-2">
                  <Activity size={14} />
                  <span>Multidisciplinary Review</span>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-[#332C26]">
                  Disciplines We Welcome
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scopeOfPractice.map((scope, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-[#EBDFD3] shadow-xs">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <Briefcase size={18} className="text-[#6E8261]" />
                      <h4 className="text-base font-serif font-semibold text-[#332C26]">
                        {scope.specialty}
                      </h4>
                    </div>
                    <p className="text-xs md:text-sm text-[#6E6259] leading-relaxed">
                      {scope.focus}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial Feature */}
            <div className="mt-12 bg-[#FCF6F0] rounded-3xl p-8 md:p-12 border border-[#EBDFD3] flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
              <Image
                src={testimonial.avatar}
                alt={testimonial.name}
                width={80}
                height={80}
                className="rounded-full flex-shrink-0 border-2 border-white shadow-sm"
              />
              <div>
                <p className="text-base md:text-lg italic font-serif text-[#332C26] mb-3">
                  {testimonial.quote}
                </p>
                <div className="text-sm font-semibold text-[#332C26]">
                  {testimonial.name}
                </div>
                <div className="text-xs text-[#6E6259]">
                  {testimonial.position}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Dedicated Clinician Registration Form */}
        <section className="py-16 md:py-24 bg-[#FBF3EC] border-t border-[#EBDFD3]" id="intake-form">
          <Container>
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#EBDFD3]">
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-[#566A4B] uppercase tracking-wider block mb-1">
                  {form.badge}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#332C26]">
                  {form.heading}
                </h2>
                <p className="text-[#6E6259] text-xs md:text-sm mt-2">
                  {form.body}
                </p>
              </div>

              <form action={formAction} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="clinician-name"
                    className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                  >
                    {form.fields.name.label}
                  </label>
                  <input
                    id="clinician-name"
                    type="text"
                    name="name"
                    placeholder={form.fields.name.placeholder}
                    required
                    disabled={isPending || state?.success}
                    className="w-full px-4 py-3 rounded-xl border border-[#EBDFD3] text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8261]/20 focus:border-[#6E8261]"
                    defaultValue={state?.values?.name || ""}
                  />
                  {state?.errors?.name && (
                    <p className="text-xs text-red-600 mt-1">{state.errors.name[0]}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="clinician-email"
                    className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                  >
                    {form.fields.email.label}
                  </label>
                  <input
                    id="clinician-email"
                    type="email"
                    name="email"
                    placeholder={form.fields.email.placeholder}
                    required
                    disabled={isPending || state?.success}
                    className="w-full px-4 py-3 rounded-xl border border-[#EBDFD3] text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8261]/20 focus:border-[#6E8261]"
                    defaultValue={state?.values?.email || ""}
                  />
                  {state?.errors?.email && (
                    <p className="text-xs text-red-600 mt-1">{state.errors.email[0]}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="clinician-context"
                    className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                  >
                    {form.fields.specialty.label}
                  </label>
                  <select
                    id="clinician-context"
                    name="context"
                    required
                    defaultValue={state?.values?.context || ""}
                    disabled={isPending || state?.success}
                    className="w-full px-4 py-3 rounded-xl border border-[#EBDFD3] text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E8261]/20 focus:border-[#6E8261]"
                  >
                    <option value="" disabled>Select your specialty</option>
                    {form.fields.specialty.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {state?.errors?.context && (
                    <p className="text-xs text-red-600 mt-1">{state.errors.context[0]}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending || state?.success}
                  className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#6E8261] hover:bg-[#566A4B] !text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{form.pendingText}</span>
                    </>
                  ) : (
                    <span>{form.submit}</span>
                  )}
                </button>

                {state?.message && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-3 ${
                      state.success
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {state.success ? (
                      <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                    )}
                    <span>{state.message}</span>
                  </div>
                )}
              </form>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
