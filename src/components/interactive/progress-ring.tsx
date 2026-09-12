import React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // percentage, e.g. 72
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  value,
  size = 58,
  strokeWidth = 6,
  className,
}: ProgressRingProps) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn("progress-ring", className)}
      role="img"
      aria-label={`${value} percent progress`}
    >
      <svg viewBox="0 0 80 80" width={size} height={size}>
        <circle
          className="progress-ring__track"
          cx="40"
          cy="40"
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring__value"
          cx="40"
          cy="40"
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="progress-ring__label">{value}%</span>
    </div>
  );
}
