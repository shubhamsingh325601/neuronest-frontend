import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  script?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  script,
  title,
  subtitle,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "empathy__intro",
        align === "center" && "text-center mx-auto",
        className
      )}
    >
      {script && (
        <p className="script-line script-line--sm">
          {script}
        </p>
      )}
      <h2>{title}</h2>
      {subtitle && <p className="section-head__subtitle">{subtitle}</p>}
    </div>
  );
}
