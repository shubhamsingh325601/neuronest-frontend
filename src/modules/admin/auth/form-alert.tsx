import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  error: { icon: AlertCircle, role: "alert", className: "border-destructive/30 bg-destructive/10 text-destructive" },
  notice: { icon: Info, role: "status", className: "border-info/30 bg-info/10 text-info" },
  success: { icon: CheckCircle2, role: "status", className: "border-success/30 bg-success/10 text-success" },
} as const;

/** Same visual language as the login form's error / notice slots. */
export function FormAlert({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  const { icon: Icon, role, className } = TONES[tone];
  return (
    <div role={role} className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm", className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
