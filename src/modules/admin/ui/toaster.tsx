"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "../theme/theme-provider";

// Themed through tokens only; sonner's own colours are overridden via CSS variables.
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!border-border !bg-popover !text-popover-foreground !shadow-md",
          description: "!text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--success)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--border)",
          "--warning-bg": "var(--popover)",
          "--warning-text": "var(--warning)",
          "--warning-border": "var(--border)",
          "--info-bg": "var(--popover)",
          "--info-text": "var(--info)",
          "--info-border": "var(--border)",
        } as React.CSSProperties
      }
    />
  );
}
