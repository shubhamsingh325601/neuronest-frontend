import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "clinical" | "clinical-tag" | "hero-pill";
  tint?: "coral" | "sage" | "gold" | "understand" | "nurture" | "empower";
  icon?: React.ReactNode;
}

export function Badge({
  variant = "clinical",
  tint,
  icon,
  children,
  className,
  ...props
}: BadgeProps) {
  if (variant === "hero-pill") {
    return (
      <span
        className={cn(
          "hero-pill",
          tint && `hero-pill--${tint}`,
          className
        )}
        {...props}
      >
        {icon && <span className="hero-pill__icon">{icon}</span>}
        <span>{children}</span>
      </span>
    );
  }

  if (variant === "clinical-tag") {
    return (
      <span className={cn("neuronest-tag", className)} {...props}>
        {icon && <span className="neuronest-tag-icon">{icon}</span>}
        <span>{children}</span>
      </span>
    );
  }

  return (
    <span className={cn("neuronest-badge", className)} {...props}>
      {icon && <span className="neuronest-badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function IconBadge({
  tint = "coral",
  icon,
  className,
}: {
  tint?: "coral" | "sage" | "gold";
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("icon-badge", `icon-badge--${tint}`, className)}>
      {icon}
    </span>
  );
}
