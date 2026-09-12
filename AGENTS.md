<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NeuroNest Frontend — Agent Operating Rules

> **NeuroNest** is a science-backed, human-reviewed digital health companion for parents of children (ages 2–8) with neurodevelopmental differences (ADHD, Autism, sensory processing differences, and developmental delays).

This repository is built with **Next.js 16 (App Router + Turbopack)**, **React 19**, **TypeScript 5**, **Tailwind CSS v4**, **Motion**, and **Lucide Icons**.

---

## 1. Core Engineering Principles

- **Component-Driven Composition:**
  - Atomic UI primitives live in `src/components/ui/` (`Button`, `Badge`, `Card`, `SectionHeader`, `Accordion`, `Input`, `Container`).
  - Layout structures live in `src/components/layout/` (`SiteHeader`, `SiteFooter`).
  - Page-specific section compositions live in `src/components/sections/` (`Hero`, `Empathy`, `FeatureGrid`, `HowItWorks`, `Clinicians`, `Trust`, `Closing`, `LeadForms`, `Faq`).
  - Interactive client islands live in `src/components/interactive/` (`PhoneMock`, `ProgressRing`, `MotionReveal`).
- **100% Design Token Fidelity:**
  - Follow the exact design tokens and CSS variables declared in `src/app/globals.css`.
  - Color palette: Warm Sage, Terracotta, Soft Amber, Gentle Cream background (`#FDFBF7`), Slate typography.
  - Typography: `Lora` (editorial serif headings), `Caveat` (warm script eyebrows/accents), `Inter` (readable UI body).
  - Do NOT invent arbitrary ad-hoc inline styles or contradictory CSS classes.
- **Copy is Data (Separation of Concerns):**
  - Marketing copy and content must NEVER be hard-coded inside components.
  - Modular content lives in `src/content/` (`home.ts`, `for-parents.ts`, `for-clinicians.ts`, `how-it-works.ts`, `faq.ts`, `privacy.ts`, `site.ts`).
  - `src/lib/content.ts` acts as the backward-compatible entry point re-exporting from `src/content`.
- **Server-First Architecture:**
  - Pages and layouts are React Server Components (RSC) by default for optimal SEO, bundle size, and fast initial load.
  - Mark components with `"use client"` **only** when client-side interactivity is required (form state handling, dropdown/mobile menu toggles, accordion animations, Framer Motion interactions).
- **Direct Server Actions + Zod Validation:**
  - Form validation schemas are strictly typed with Zod in `src/lib/schemas.ts`.
  - Handled via Next.js Server Actions in `src/app/actions.ts` (`submitWaitlist`, `submitClinicianLead`, `submitNewsletter`).
  - Optional Google Sheets webhook synchronization is integrated seamlessly into server actions.
  - Avoid unnecessary repository abstraction layers or mock services.
- **Strict Quality Gate:**
  - Every change must cleanly pass:
    1. `npm run typecheck` (`tsc --noEmit`)
    2. `npm run build` (`next build`)

---

## 2. Directory & Route Overview

```
src/
├── app/
│   ├── layout.tsx              # Root HTML shell, font declarations, and metadata
│   ├── page.tsx                # Main landing page composing core narrative sections
│   ├── for-parents/page.tsx    # Dedicated Parent Experience deep-dive route
│   ├── for-clinicians/page.tsx # Clinician partnership & accreditation page
│   ├── how-it-works/page.tsx   # Detailed 4-step workflow, methodology & privacy
│   ├── faq/page.tsx            # Comprehensive categorized FAQ page
│   ├── privacy/page.tsx        # GDPR / UK Data Protection compliant privacy policy
│   ├── globals.css             # Unified design system tokens, Tailwind v4 directives
│   ├── actions.ts              # Server Actions for forms with optional webhook sync
│   ├── robots.ts               # Dynamic robots.txt generation
│   ├── sitemap.ts              # Dynamic XML sitemap generation
│   ├── not-found.tsx           # Custom 404 page
│   └── error.tsx               # Client error boundary
├── components/
│   ├── ui/                     # Atomic primitives (Button, Card, Badge, Accordion, Input)
│   ├── layout/                 # Global layout (SiteHeader, SiteFooter)
│   ├── sections/               # Composed marketing sections
│   └── interactive/            # Client motion & interactive visual widgets
├── content/                    # Typed modular content data sources
│   ├── home.ts                 # Landing page copy & structure
│   ├── for-parents.ts          # Parent journey content
│   ├── for-clinicians.ts       # Clinical collaboration content
│   ├── how-it-works.ts         # Clinical pipeline & security data
│   ├── faq.ts                  # Categorized questions & answers
│   ├── privacy.ts              # Legal, GDPR, and safeguarding disclosures
│   ├── site.ts                 # Brand configuration, nav items, and footer links
│   └── index.ts                # Central barrel export
├── lib/
│   ├── content.ts              # Re-export barrel for content
│   ├── schemas.ts              # Zod validation schemas
│   ├── seo.ts                  # Metadata helpers & JSON-LD generators
│   ├── theme.ts                # Color token constants & utilities
│   └── utils.ts                # cn() class merge helper (clsx + tailwind-merge)
public/
└── assets/                     # Optimized static assets & brand graphics
```

---

## 3. Standard Development Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server with Turbopack |
| `npm run build` | Builds the production bundle with Next.js |
| `npm run start` | Boots the compiled production server |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run typecheck` | Executes TypeScript type verification (`tsc --noEmit`) |

---

## 4. Documentation References

- [`docs/architecture.md`](docs/architecture.md) — Architectural patterns, component hierarchy, and data flow.
- [`docs/design-system.md`](docs/design-system.md) — Typography scales, color tokens, button/card variants, spacing.
- [`docs/data-layer.md`](docs/data-layer.md) — Zod schemas, Server Action states, webhook integration.
