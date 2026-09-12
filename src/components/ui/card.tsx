import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "feature" | "form" | "testimonial" | "cta" | "default";
  children: React.ReactNode;
}

export function Card({
  variant = "default",
  children,
  className,
  ...props
}: CardProps) {
  const variantClass =
    variant === "feature"
      ? "feature-card"
      : variant === "form"
      ? "form-card"
      : variant === "testimonial"
      ? "testimonial-card"
      : variant === "cta"
      ? "closing__cta-card"
      : "";

  return (
    <div className={cn(variantClass, className)} {...props}>
      {children}
    </div>
  );
}
