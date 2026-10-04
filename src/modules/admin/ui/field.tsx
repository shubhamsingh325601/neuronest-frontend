import { cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  /** A single form control (Input, textarea, ...). Field wires id, aria-invalid and aria-describedby into it. */
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean | "true" | "false";
    "aria-describedby"?: string;
  }>;
  description?: string;
  error?: string;
  className?: string;
}

export function Field({ label, children, description, error, className }: FieldProps) {
  const uid = useId();
  const id = children.props.id ?? `${uid}-control`;
  const descriptionId = description ? `${uid}-description` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy = [children.props["aria-describedby"], descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      {isValidElement(children)
        ? cloneElement(children, {
            id,
            "aria-invalid": error ? true : children.props["aria-invalid"],
            "aria-describedby": describedBy || undefined,
          })
        : children}
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
