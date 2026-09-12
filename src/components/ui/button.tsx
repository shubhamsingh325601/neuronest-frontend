import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "link";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
  href?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      pill = true,
      href,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isLink = Boolean(href);

    const baseClass =
      variant === "link"
        ? "link-cta"
        : cn(
            "btn",
            variant === "primary" && "btn--primary",
            variant === "secondary" && "btn--secondary",
            pill && "btn--pill",
            size === "sm" && "btn--sm",
            size === "lg" && "btn--lg"
          );

    const content = (
      <>
        {leftIcon}
        {children && <span>{children}</span>}
        {rightIcon}
      </>
    );

    if (isLink && href) {
      return (
        <Link
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cn(baseClass, className)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(baseClass, className)}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
