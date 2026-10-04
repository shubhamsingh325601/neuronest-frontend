import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { ThemeToggle } from "../theme/theme-toggle";
import { BrandMark } from "./brand-mark";

const HIGHLIGHTS = [
  { icon: HeartHandshake, text: "Invite clinicians and shape each child's care team." },
  { icon: ShieldCheck, text: "Restricted to approved NeuroNest administrators." },
  { icon: Sparkles, text: "Calm, focused tools for the people behind the care." },
];

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Small text under the card. Defaults to the administrators-only note. */
  footer?: React.ReactNode;
}

/** Split-panel shell shared by every pre-session screen (sign in, forgot / reset password, account setup). */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-brand-panel p-12 text-brand-panel-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Decorative nest: soft brand glows and concentric arcs. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-chart-3/25 blur-3xl" />
          <svg
            className="absolute -bottom-40 -right-40 size-[34rem] text-brand-panel-foreground/15"
            viewBox="0 0 400 400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <circle cx="200" cy="200" r="60" />
            <circle cx="200" cy="200" r="110" />
            <circle cx="200" cy="200" r="160" />
            <circle cx="200" cy="200" r="210" />
          </svg>
        </div>

        <BrandMark size={48} className="relative" />

        <div className="relative max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-panel-muted">
            Nurture · Support · Empower
          </p>
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight">
            Care coordination, held with care.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-panel-muted">
            Everything you need to keep families and clinicians supported, in one quiet place.
          </p>
          <ul className="mt-10 grid gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-panel-foreground/10">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-panel-muted">Building stronger minds. Creating brighter futures.</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8" id="main">
        <div className="flex items-center justify-between">
          <BrandMark size={40} className="lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <header className="mb-6 grid gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </header>
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {footer ?? "Parents and clinicians use the NeuroNest app. This console is for administrators only."}
          </p>
        </div>
      </main>
    </div>
  );
}
