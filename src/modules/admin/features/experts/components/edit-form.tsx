"use client";

import { useState } from "react";
import { toast } from "../../../notifications/toast";
import { Button } from "../../../ui/button";
import { parseEditForm, type ExpertFieldErrors, type ExpertFormValues } from "../api/form";
import type { ExpertDetail } from "../api/types";
import { useUpdateExpert } from "../hooks/use-experts";
import { describeSaveError, ErrorBanner } from "./create-form";
import { ExpertFields } from "./expert-fields";

export function EditForm({ expert }: { expert: ExpertDetail }) {
  const update = useUpdateExpert(expert.id);
  const [values, setValues] = useState<ExpertFormValues>({ name: expert.name, email: expert.email, password: "" });
  const [errors, setErrors] = useState<ExpertFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();

  const set = (name: keyof ExpertFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (update.isPending) return;
    setFormError(undefined);
    const parsed = parseEditForm(values, expert);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    if (!parsed.changed) {
      toast.info("Nothing to save", { description: "No details were changed." });
      return;
    }
    update.mutate(parsed.input, {
      onSuccess: (saved) => {
        setValues({ name: saved.name, email: saved.email, password: "" });
        toast.success("Changes saved", {
          description: parsed.input.password ? "The new password works straight away. Pass it on to them yourself." : undefined,
        });
      },
      onError: (error) => {
        const copy = describeSaveError(error);
        setErrors(copy.fields ?? {});
        setFormError(copy.form);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid max-w-3xl gap-6">
      {formError ? <ErrorBanner message={formError} /> : null}
      <ExpertFields
        values={values}
        errors={errors}
        onChange={set}
        onPassword={(password) => setValues((current) => ({ ...current, password }))}
        description="Name, sign-in email and password."
        passwordLabel="New password"
        passwordDescription="Leave blank to keep the current password. At least 10 characters otherwise."
      />
      <div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
