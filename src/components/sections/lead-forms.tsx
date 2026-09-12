"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import {
  UserRound,
  Mail,
  Stethoscope,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { forParentsContent } from "@/content/for-parents";
import { forCliniciansContent } from "@/content/for-clinicians";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { MotionReveal } from "@/components/interactive/motion-reveal";
import { submitParentWaitlist, submitClinicianSignup } from "@/app/actions";

export function LeadForms() {
  const parentForm = forParentsContent.form;
  const clinicianForm = forCliniciansContent.form;

  const [parentState, parentAction, isParentPending] = useActionState(
    submitParentWaitlist,
    {}
  );
  const [clinicianState, clinicianAction, isClinicianPending] = useActionState(
    submitClinicianSignup,
    {}
  );

  return (
    <section className="forms py-16 md:py-24" id="waitlist" aria-labelledby="forms-heading">
      <Container>
        <MotionReveal>
          <SectionHeader
            script="EARLY COHORT ENROLLMENT"
            title="Take Your Next Step with Us"
            className="mb-12"
          />
        </MotionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Parent Waitlist Card */}
          <MotionReveal delay={0.1} className="h-full">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-[#EBDFD3] flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FBE3DA] text-[#C85F45]">
                    <UserRound size={14} aria-hidden="true" />
                    <span>{parentForm.badge}</span>
                  </div>
                  <Link
                    href="/for-parents"
                    className="text-xs font-semibold text-[#C85F45] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Parent Guide</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <h3 id="waitlist-heading" className="text-2xl font-serif font-semibold text-[#332C26] mb-2">
                  {parentForm.heading}
                </h3>
                <p className="text-[#6E6259] text-sm md:text-base mb-6 min-h-[44px]">
                  {parentForm.body}
                </p>

                <form action={parentAction} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor="parent-name"
                      className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                    >
                      {parentForm.fields.name.label}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <UserRound size={16} />
                      </span>
                      <input
                        type="text"
                        id="parent-name"
                        name="name"
                        autoComplete="name"
                        placeholder={parentForm.fields.name.placeholder}
                        required
                        disabled={isParentPending || parentState?.success}
                        defaultValue={parentState?.values?.name || ""}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          parentState?.errors?.name
                            ? "border-red-500 focus:ring-red-200"
                            : "border-[#EBDFD3] focus:border-[#E2775B] focus:ring-[#E2775B]/20"
                        }`}
                      />
                    </div>
                    {parentState?.errors?.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {parentState.errors.name[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="parent-email"
                      className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                    >
                      {parentForm.fields.email.label}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        id="parent-email"
                        name="email"
                        autoComplete="email"
                        placeholder={parentForm.fields.email.placeholder}
                        required
                        disabled={isParentPending || parentState?.success}
                        defaultValue={parentState?.values?.email || ""}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          parentState?.errors?.email
                            ? "border-red-500 focus:ring-red-200"
                            : "border-[#EBDFD3] focus:border-[#E2775B] focus:ring-[#E2775B]/20"
                        }`}
                      />
                    </div>
                    {parentState?.errors?.email && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {parentState.errors.email[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="parent-context"
                      className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                    >
                      {parentForm.fields.concern.label}
                    </label>
                    <div className="relative">
                      <select
                        id="parent-context"
                        name="context"
                        required
                        disabled={isParentPending || parentState?.success}
                        defaultValue={parentState?.values?.context || parentForm.fields.concern.options[0]}
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          parentState?.errors?.context
                            ? "border-red-500 focus:ring-red-200"
                            : "border-[#EBDFD3] focus:border-[#E2775B] focus:ring-[#E2775B]/20"
                        }`}
                      >
                        {parentForm.fields.concern.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    {parentState?.errors?.context && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {parentState.errors.context[0]}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isParentPending || parentState?.success}
                    className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#E2775B] hover:bg-[#C85F45] !text-white font-semibold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isParentPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{parentForm.pendingText}</span>
                      </>
                    ) : (
                      <span>{parentForm.submit}</span>
                    )}
                  </button>

                  {parentState?.message && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-3 ${
                        parentState.success
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                      role="status"
                    >
                      {parentState.success ? (
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                      )}
                      <span>{parentState.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </MotionReveal>

          {/* Clinician Registration Card */}
          <MotionReveal delay={0.2} className="h-full">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-[#EBDFD3] flex flex-col justify-between h-full transition-all duration-300 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#E4EAE0] text-[#566A4B]">
                    <Stethoscope size={14} aria-hidden="true" />
                    <span>{clinicianForm.badge}</span>
                  </div>
                  <Link
                    href="/for-clinicians"
                    className="text-xs font-semibold text-[#566A4B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Clinician Info</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <h3 id="clinician-form-heading" className="text-2xl font-serif font-semibold text-[#332C26] mb-2">
                  {clinicianForm.heading}
                </h3>
                <p className="text-[#6E6259] text-sm md:text-base mb-6 min-h-[44px]">
                  {clinicianForm.body}
                </p>

                <form action={clinicianAction} noValidate className="space-y-4">
                  <div>
                    <label
                      htmlFor="clinician-name"
                      className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                    >
                      {clinicianForm.fields.name.label}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <UserRound size={16} />
                      </span>
                      <input
                        type="text"
                        id="clinician-name"
                        name="name"
                        autoComplete="name"
                        placeholder={clinicianForm.fields.name.placeholder}
                        required
                        disabled={isClinicianPending || clinicianState?.success}
                        defaultValue={clinicianState?.values?.name || ""}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          clinicianState?.errors?.name
                            ? "border-red-500 focus:ring-red-200"
                            : "border-[#EBDFD3] focus:border-[#6E8261] focus:ring-[#6E8261]/20"
                        }`}
                      />
                    </div>
                    {clinicianState?.errors?.name && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {clinicianState.errors.name[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="clinician-email"
                      className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                    >
                      {clinicianForm.fields.email.label}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        id="clinician-email"
                        name="email"
                        autoComplete="email"
                        placeholder={clinicianForm.fields.email.placeholder}
                        required
                        disabled={isClinicianPending || clinicianState?.success}
                        defaultValue={clinicianState?.values?.email || ""}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          clinicianState?.errors?.email
                            ? "border-red-500 focus:ring-red-200"
                            : "border-[#EBDFD3] focus:border-[#6E8261] focus:ring-[#6E8261]/20"
                        }`}
                      />
                    </div>
                    {clinicianState?.errors?.email && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {clinicianState.errors.email[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="clinician-context"
                      className="block text-xs font-semibold text-[#332C26] uppercase tracking-wider mb-1.5"
                    >
                      {clinicianForm.fields.specialty.label}
                    </label>
                    <div className="relative">
                      <select
                        id="clinician-context"
                        name="context"
                        required
                        disabled={isClinicianPending || clinicianState?.success}
                        defaultValue={clinicianState?.values?.context || ""}
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-[#332C26] bg-[#FCF6F0] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          clinicianState?.errors?.context
                            ? "border-red-500 focus:ring-red-200"
                            : "border-[#EBDFD3] focus:border-[#6E8261] focus:ring-[#6E8261]/20"
                        }`}
                      >
                        <option value="" disabled>
                          Select your specialty
                        </option>
                        {clinicianForm.fields.specialty.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    {clinicianState?.errors?.context && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {clinicianState.errors.context[0]}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isClinicianPending || clinicianState?.success}
                    className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#6E8261] hover:bg-[#566A4B] !text-white font-semibold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isClinicianPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{clinicianForm.pendingText}</span>
                      </>
                    ) : (
                      <span>{clinicianForm.submit}</span>
                    )}
                  </button>

                  {clinicianState?.message && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 mt-3 ${
                        clinicianState.success
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                      role="status"
                    >
                      {clinicianState.success ? (
                        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                      )}
                      <span>{clinicianState.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </MotionReveal>
        </div>
      </Container>
    </section>
  );
}
