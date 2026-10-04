"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Lock,
  UserRound,
  Mail,
  HelpCircle,
  Clock,
  ArrowDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Quote,
  Baby,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/ui/container";
import { Accordion } from "@/components/ui/accordion";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { submitParentWaitlist } from "@/app/actions";
import { forParentsContent } from "@/content/for-parents";

export default function ForParentsPage() {
  const [state, formAction, isPending] = useActionState(
    submitParentWaitlist,
    {}
  );
  const { hero, principles, journey, testimonials, form, faqs } =
    forParentsContent;

  const principleIcons: Record<string, React.ReactNode> = {
    heart: <Heart size={24} className="text-[#E2775B]" />,
    "shield-check": <ShieldCheck size={24} className="text-[#6E8261]" />,
    sparkles: <Sparkles size={24} className="text-[#C4922E]" />,
    lock: <Lock size={24} className="text-[#E2775B]" />,
  };

  return (
    <>
      <SiteHeader />
      <main id="main" className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="py-14 md:py-20 bg-[#FCF6F0] border-b border-[#EBDFD3]/60">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <MotionReveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FBE3DA] text-[#C85F45] mb-5">
                  <Baby size={15} />
                  <span>{hero.badge}</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-[#332C26] mb-5 leading-tight">
                  {hero.heading}
                </h1>
                <p className="script-line script-line--sm mb-4 text-[#C85F45]">
                  {hero.script}
                </p>
                <p className="text-[#6E6259] text-base md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
                  {hero.subhead}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href={hero.cta.href}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E2775B] hover:bg-[#C85F45] !text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                  >
                    <span>{hero.cta.label}</span>
                    <ArrowDown size={16} />
                  </a>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white border border-[#EBDFD3] text-[#332C26] hover:bg-[#F8EFEA] font-semibold text-sm transition-colors"
                  >
                    <span>Explore Methodology</span>
                  </Link>
                </div>
              </MotionReveal>
            </div>
          </Container>
        </section>

        {/* Guiding Principles */}
        <section className="py-16 md:py-24 bg-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="script-line script-line--sm mb-2">{principles.script}</p>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#332C26]">
                {principles.heading}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {principles.items.map((item, idx) => (
                <MotionReveal key={item.title} delay={idx * 0.1}>
                  <div className="h-full bg-[#FCF6F0] p-7 rounded-2xl border border-[#EBDFD3] flex flex-col justify-between hover:border-[#E2775B]/40 transition-colors">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-5 shadow-xs border border-[#EBDFD3]/60">
                        {principleIcons[item.icon] || <Heart size={24} className="text-[#E2775B]" />}
                      </div>
                      <h3 className="text-xl font-serif font-semibold text-[#332C26] mb-3">
                        {item.title}
                      </h3>
                      <p className="text-[#6E6259] text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Journey Timeline */}
        <section className="py-16 md:py-24 bg-[#FBF7F2] border-y border-[#EBDFD3]/60">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="script-line script-line--sm mb-2">{journey.script}</p>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#332C26]">
                {journey.heading}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {journey.steps.map((step, idx) => (
                <MotionReveal key={step.step} delay={idx * 0.1}>
                  <div className="relative bg-white p-7 rounded-2xl border border-[#EBDFD3] shadow-xs flex flex-col h-full">
                    <span className="text-3xl font-serif font-bold text-[#E2775B]/40 mb-3">
                      {step.step}
                    </span>
                    <h3 className="text-lg font-serif font-semibold text-[#332C26] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[#6E6259] text-sm leading-relaxed flex-1">
                      {step.description}
                    </p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-20 bg-white">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((t, idx) => (
                <MotionReveal key={idx} delay={idx * 0.15}>
                  <div className="bg-[#FAF3ED] p-8 rounded-2xl border border-[#E9DDD1] relative">
                    <Quote className="text-[#E2775B]/20 w-10 h-10 mb-4" />
                    <p className="font-serif italic text-base md:text-lg text-[#332C26] mb-6 leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <p className="font-semibold text-sm text-[#332C26]">{t.author}</p>
                      <p className="text-xs text-[#6E6259]">{t.role}</p>
                    </div>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </Container>
        </section>

        {/* Interactive Parent Registration Form */}
        <section
          id="join-waitlist"
          className="py-16 md:py-24 bg-[#FAF5EE] border-t border-[#EBDFD3]/60 scroll-mt-24"
        >
          <Container>
            <div className="max-w-2xl mx-auto">
              <MotionReveal>
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-md border border-[#EBDFD3]">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FBE3DA] text-[#C85F45] mb-4">
                    <UserRound size={14} />
                    <span>{form.badge}</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#332C26] mb-3">
                    {form.heading}
                  </h2>
                  <p className="text-[#6E6259] text-sm md:text-base mb-8">
                    {form.body}
                  </p>

                  <form action={formAction} noValidate className="space-y-5">
                    <div>
                      <label
                        htmlFor="parent-name"
                        className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                      >
                        {form.fields.name.label}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <UserRound size={16} />
                        </span>
                        <input
                          id="parent-name"
                          name="name"
                          type="text"
                          required
                          placeholder={form.fields.name.placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EBDFD3] text-sm bg-[#FCF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E2775B]/30 focus:border-[#E2775B] transition-all"
                          defaultValue={state?.values?.name || ""}
                        />
                      </div>
                      {state?.errors?.name && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} /> {state.errors.name[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="parent-email"
                        className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                      >
                        {form.fields.email.label}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail size={16} />
                        </span>
                        <input
                          id="parent-email"
                          name="email"
                          type="email"
                          required
                          placeholder={form.fields.email.placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EBDFD3] text-sm bg-[#FCF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E2775B]/30 focus:border-[#E2775B] transition-all"
                          defaultValue={state?.values?.email || ""}
                        />
                      </div>
                      {state?.errors?.email && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} /> {state.errors.email[0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="parent-context"
                        className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                      >
                        {form.fields.concern.label}
                      </label>
                      <div className="relative">
                        <select
                          id="parent-context"
                          name="context"
                          className="w-full px-4 py-3 rounded-xl border border-[#EBDFD3] text-sm bg-[#FCF9F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E2775B]/30 focus:border-[#E2775B] transition-all"
                          defaultValue={state?.values?.context || form.fields.concern.options[0]}
                        >
                          {form.fields.concern.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      {state?.errors?.context && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} /> {state.errors.context[0]}
                        </p>
                      )}
                    </div>

                    {state?.message && (
                      <div
                        className={`p-4 rounded-xl text-sm flex items-start gap-2.5 ${
                          state.success
                            ? "bg-[#EBF3E8] text-[#36502E] border border-[#C6DFBD]"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {state.success ? (
                          <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#6E8261]" />
                        ) : (
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        )}
                        <span>{state.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-3.5 px-6 rounded-xl bg-[#E2775B] hover:bg-[#C85F45] !text-white font-semibold text-sm shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
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

                    <p className="text-center text-xs text-[#8A7C73] mt-3">
                      {form.privacyNote}
                    </p>
                  </form>
                </div>
              </MotionReveal>
            </div>
          </Container>
        </section>

        {/* Dedicated Parent FAQ */}
        <section className="py-16 md:py-24 bg-white border-t border-[#EBDFD3]/60">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FCF6F0] text-[#8A7C73] border border-[#EBDFD3] mb-3">
                  <HelpCircle size={14} />
                  <span>Common Questions</span>
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#332C26]">
                  Everything You Need to Know
                </h2>
              </div>

              <Accordion items={faqs} />

              <div className="text-center mt-8">
                <Link
                  href="/faq"
                  className="text-sm font-semibold text-[#E2775B] hover:underline"
                >
                  View full Knowledge Base &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
