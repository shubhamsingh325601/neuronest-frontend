# CLAUDE.md — Assistant Guidelines for NeuroNest Frontend

@AGENTS.md

Welcome to the **NeuroNest Frontend** repository. NeuroNest is a science-backed, human-reviewed digital health companion designed for parents of children (ages 2–8) with neurodevelopmental differences (ADHD, Autism, sensory processing needs, and developmental delays).

This document outlines key technical patterns, commands, architecture, and styling rules to follow when generating code, refactoring, or reviewing changes.

---

## 1. Tech Stack Overview

- **Framework:** Next.js 16.3+ (App Router, Turbopack, React Server Components)
- **Runtime:** React 19 + Node.js 20+
- **Language:** TypeScript 5 (strict type-checking)
- **Styling:** Tailwind CSS v4 + custom CSS variables design system in `src/app/globals.css`
- **Animations:** Motion (`motion/react` v13+)
- **Icons:** `lucide-react`
- **Validation:** `zod` v4
- **Formatting / Linting:** ESLint 9 (`eslint-config-next`), Prettier / EditorConfig

---

## 2. Essential Commands

Always run commands from the project root (`d:\Shubham_Projects\neuro-nest\frontend`):

```bash
# Start Turbopack dev server (default port: http://localhost:3000)
npm run dev

# Run TypeScript compilation check without emitting files
npm run typecheck

# Run Next.js production build (RSC compilation + static page generation)
npm run build

# Start the compiled production build
npm run start

# Run ESLint validation
npm run lint
```

> **Rule:** Always verify code changes with `npm run typecheck` followed by `npm run build` before pushing commits.

---

## 3. Architecture & File Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root shell with Lora, Caveat & Inter fonts, JSON-LD, metadata
│   ├── page.tsx                # Homepage composed of modular sections
│   ├── for-parents/page.tsx    # Parent journey & developmental milestones route
│   ├── for-clinicians/page.tsx # Clinician onboarding, ethics & review model route
│   ├── how-it-works/page.tsx   # 4-step video review pipeline & clinical safeguarding
│   ├── faq/page.tsx            # Categorized FAQ accordion route
│   ├── privacy/page.tsx        # GDPR & safeguarding compliance legal page
│   ├── globals.css             # Unified tokens, font definitions, and Tailwind v4 setup
│   ├── actions.ts              # Server Actions (waitlist, clinician lead, newsletter)
│   ├── robots.ts               # Dynamic SEO robots.txt
│   ├── sitemap.ts              # Dynamic sitemap.xml
│   ├── not-found.tsx           # Custom 404 page
│   └── error.tsx               # Client error boundary
├── components/
│   ├── ui/                     # Reusable atomic UI primitives
│   │   ├── button.tsx          # Pill/rounded variants, sizes, icon integration
│   │   ├── badge.tsx           # Tone badges (Warm Sage, Terracotta, Amber, Slate)
│   │   ├── card.tsx            # Base card, elevated card, testimonial card
│   │   ├── section-header.tsx  # Script eyebrow + editorial serif title + subtitle
│   │   ├── accordion.tsx       # Accessible expandable FAQ widget
│   │   ├── input.tsx           # FormField, Input, Select, Textarea
│   │   └── container.tsx       # Responsive layout container with max-w presets
│   ├── layout/                 # Structural shell
│   │   ├── site-header.tsx     # Responsive navigation, mobile drawer, primary CTA
│   │   └── site-footer.tsx     # Brand footer with dual wave SVG, links & newsletter
│   ├── sections/               # Composed marketing sections
│   │   ├── hero.tsx            # Hero visual art, pills, quote, action buttons
│   │   ├── empathy.tsx         # Empathy problem narrative, guiding principle pull-quote
│   │   ├── feature-grid.tsx    # 4 foundational care cards with colored icon badges
│   │   ├── how-it-works.tsx    # 4-step workflow + phone mockup + parent testimonial card
│   │   ├── clinicians.tsx      # Exact Clinicians card (avatar, quote, badges, tags)
│   │   ├── trust.tsx           # Trust & Ethics compliance checklist card
│   │   ├── closing.tsx         # Nest branches visual, community items, join CTA card
│   │   ├── lead-forms.tsx      # Parent waitlist form + Clinician registration form
│   │   └── faq.tsx             # Interactive FAQ accordion
│   └── interactive/            # Client-side animation & interactive widgets
│       ├── phone-mock.tsx      # iOS mockup with status bar, today's focus, tabs
│       ├── progress-ring.tsx   # Animated SVG circle progress indicator
│       └── motion-reveal.tsx   # Motion scroll entrance wrapper
├── content/                    # Typed data files for all copy
│   ├── home.ts, for-parents.ts, for-clinicians.ts, how-it-works.ts, faq.ts, privacy.ts, site.ts
│   └── index.ts                # Central barrel export
└── lib/
    ├── content.ts              # Backward-compatible re-export barrel
    ├── schemas.ts              # Zod validation schemas for forms
    ├── seo.ts                  # Metadata generators & Structured Data (JSON-LD)
    ├── theme.ts                # Color token constants & helper maps
    └── utils.ts                # cn() class merge helper (clsx + tailwind-merge)
```

---

## 4. Key Conventions & Best Practices

### A. Separation of Copy & Logic
- **Do not hardcode marketing text or headlines inside JSX.**
- Place all text, bullet points, labels, and metadata in `src/content/`.
- Import data from `@/content` or `@/lib/content`.

### B. React Server Components (RSC) vs Client Components
- By default, all pages and layout components must remain **Server Components**.
- Add `"use client"` directive **only** when components use:
  - React hooks (`useState`, `useEffect`, `useActionState`, `useRef`)
  - Motion / animation interactions
  - DOM event listeners (mobile hamburger drawer, accordion toggle)

### C. Design Tokens & Styling
- Colors are defined semantically in `src/app/globals.css`:
  - Background: Gentle Cream (`#FDFBF7`)
  - Primary / Brand: Warm Sage & Deep Forest Slate
  - Accents: Terracotta (`#C86D51`), Soft Amber (`#D99B26`), Rose (`#D47A70`)
- Fonts:
  - Headings: `font-serif` (`Lora`)
  - Script Eyebrows: `font-script` (`Caveat`)
  - Body / UI: `font-sans` (`Inter`)
- Always use the `cn(...)` utility (`src/lib/utils.ts`) when merging conditional Tailwind classes.

### D. Forms & Server Actions
- Use Zod schemas from `src/lib/schemas.ts` for form input parsing and validation.
- Submit via Next.js Server Actions in `src/app/actions.ts`.
- Server Actions optionally forward payloads to Google Sheets via webhook (`GOOGLE_SHEETS_WEBHOOK_URL`).
- Return standard `{ success: boolean, message: string, errors?: Record<string, string[]> }` objects.

---

## 5. Pre-Commit Verification

Before submitting or committing:
1. Run `npm run typecheck` — ensures 0 TypeScript errors.
2. Run `npm run build` — ensures all 11 static pages and routes compile successfully.
3. Check Git status to ensure sensitive files like `.env.local` remain untracked.
