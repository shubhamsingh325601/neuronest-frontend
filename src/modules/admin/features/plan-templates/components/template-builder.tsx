"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ErrorCode, isApiError } from "../../../lib/api-errors";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Field } from "../../../ui/field";
import { Input } from "../../../ui/input";
import {
  addDay,
  addSection,
  emptyDraft,
  moveDay,
  parseDraft,
  removeDay,
  removeSection,
  type DraftErrors,
  type TemplateDraft,
} from "../api/form";
import { TEMPLATE_LIMITS } from "../api/types";
import { useCreatePlanTemplate } from "../hooks/use-plan-templates";

const CONTROL =
  "w-full min-w-0 rounded-xl border border-input bg-background px-4 py-2 text-sm transition-colors placeholder:text-muted-foreground aria-invalid:border-destructive";

function describeSaveError(error: unknown): string {
  if (isApiError(error)) {
    switch (error.code) {
      case ErrorCode.ValidationError:
        return error.errors.length > 0 ? error.errors.join(" ") : "Some details were not accepted. Check them and try again.";
      case ErrorCode.RateLimited:
        return "Too many requests. Wait a moment and try again.";
      case ErrorCode.BackendUnreachable:
        return "The NeuroNest service could not be reached. Nothing was saved; try again shortly.";
      case ErrorCode.InsufficientPermissions:
        return "Your account is not allowed to create templates.";
    }
  }
  return "The template could not be saved. Please try again.";
}

const noErrors = (): DraftErrors => ({ sections: {}, dayFields: {} });

/** Creates a DRAFT template: title, optional sections and a numbered list of days. Loaded only on /new. */
export default function TemplateBuilder() {
  const router = useRouter();
  const create = useCreatePlanTemplate();
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft);
  const [errors, setErrors] = useState<DraftErrors>(noErrors);
  const [formError, setFormError] = useState<string | undefined>();

  function update(next: TemplateDraft) {
    setDraft(next);
    setErrors(noErrors());
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending) return;
    setFormError(undefined);
    const parsed = parseDraft(draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors(noErrors());
    create.mutate(parsed.input, {
      onSuccess: (template) => {
        toast.success("Draft template created", { description: "Publish it when it is ready for clinicians." });
        router.push(`${ADMIN_ROUTES.planTemplates}/${encodeURIComponent(template.id)}`);
      },
      onError: (error) => setFormError(describeSaveError(error)),
    });
  }

  const busy = create.isPending;
  return (
    <form onSubmit={submit} noValidate className="grid max-w-3xl gap-6">
      {formError ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>It is saved as a draft. Publishing is a separate step and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Title" error={errors.title}>
            <Input value={draft.title} maxLength={TEMPLATE_LIMITS.title} disabled={busy} onChange={(e) => update({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Description (optional)" error={errors.description}>
            <textarea
              rows={3}
              className={CONTROL}
              value={draft.description}
              maxLength={TEMPLATE_LIMITS.description}
              disabled={busy}
              onChange={(e) => update({ ...draft, description: e.target.value })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections (optional)</CardTitle>
          <CardDescription>Group days under headings, such as weeks. Each day can then be placed in one section.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {draft.sections.map((section, index) => (
            <div key={index} className="flex items-start gap-2">
              <Field label={`Section ${index + 1}`} error={errors.sections[index]} className="flex-1">
                <Input
                  value={section}
                  maxLength={TEMPLATE_LIMITS.sectionTitle}
                  disabled={busy}
                  onChange={(e) => update({ ...draft, sections: draft.sections.map((s, i) => (i === index ? e.target.value : s)) })}
                />
              </Field>
              <Button type="button" variant="outline" size="sm" className="mt-6" disabled={busy} onClick={() => update(removeSection(draft, index))}>
                <Trash2 aria-hidden="true" /> <span className="sr-only">Remove section {index + 1}</span>
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => update(addSection(draft))}>
              <Plus aria-hidden="true" /> Add section
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Days</CardTitle>
          <CardDescription>Days are numbered in the order shown, from 1. Moving or removing a day renumbers the rest.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {errors.days ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.days}
            </p>
          ) : null}
          {draft.days.map((day, index) => (
            <fieldset key={index} className="grid gap-3 rounded-xl border p-4">
              <legend className="px-1 text-sm font-semibold">Day {index + 1}</legend>
              <Field label="Title" error={errors.dayFields[index]?.title}>
                <Input
                  value={day.title}
                  disabled={busy}
                  onChange={(e) => update({ ...draft, days: draft.days.map((d, i) => (i === index ? { ...d, title: e.target.value } : d)) })}
                />
              </Field>
              <Field label="Instructions" error={errors.dayFields[index]?.instructions}>
                <textarea
                  rows={3}
                  className={CONTROL}
                  value={day.instructions}
                  disabled={busy}
                  onChange={(e) => update({ ...draft, days: draft.days.map((d, i) => (i === index ? { ...d, instructions: e.target.value } : d)) })}
                />
              </Field>
              <div className="flex flex-wrap items-end justify-between gap-3">
                {draft.sections.length > 0 ? (
                  <Field label="Section" className="min-w-48">
                    <select
                      className={`${CONTROL} h-11`}
                      value={day.section}
                      disabled={busy}
                      onChange={(e) => update({ ...draft, days: draft.days.map((d, i) => (i === index ? { ...d, section: e.target.value } : d)) })}
                    >
                      <option value="">No section</option>
                      {draft.sections.map((name, position) => (
                        <option key={position} value={String(position + 1)}>
                          {name.trim() || `Section ${position + 1}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={busy || index === 0} onClick={() => update(moveDay(draft, index, -1))}>
                    <ArrowUp aria-hidden="true" /> <span className="sr-only">Move day {index + 1} up</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={busy || index === draft.days.length - 1} onClick={() => update(moveDay(draft, index, 1))}>
                    <ArrowDown aria-hidden="true" /> <span className="sr-only">Move day {index + 1} down</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={busy || draft.days.length === 1} onClick={() => update(removeDay(draft, index))}>
                    <Trash2 aria-hidden="true" /> <span className="sr-only">Remove day {index + 1}</span>
                  </Button>
                </div>
              </div>
            </fieldset>
          ))}
          <div>
            <Button type="button" variant="outline" disabled={busy || draft.days.length >= TEMPLATE_LIMITS.maxDays} onClick={() => update(addDay(draft))}>
              <Plus aria-hidden="true" /> Add day
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save as draft"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={ADMIN_ROUTES.planTemplates}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
