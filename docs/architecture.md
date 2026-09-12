# Architecture

> Component-driven composition, patterns, and data flow for the NeuroNest frontend.

## Design Decisions

| Decision | Rationale |
| --- | --- |
| **Component-Driven Composition** | Reusable atomic UI primitives in `src/components/ui/` (`Button`, `Badge`, `Card`, `SectionHeader`, `Accordion`, `Input`, `Container`) composed into clean page sections in `src/components/sections/`. |
| **Direct Server Actions + Zod** | Form actions (`src/app/actions.ts`) directly validate using Zod (`src/lib/schemas.ts`) without unnecessary repository layers or fake adapters. |
| **Server Components by Default** | The landing page is server-rendered for maximum performance and SEO. Interactive elements (`SiteHeader` toggle, `LeadForms`, `SiteFooter` newsletter, `Accordion`) use `"use client"`. |
| **Tailwind CSS + Design Tokens** | Unified design tokens in `src/app/globals.css` integrated with Tailwind CSS utility classes and exact CSS specifications from `main.css`. |
| **Content as Data** | All marketing copy lives in `src/lib/content.ts` for clean separation and maintainability. |

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root HTML shell, fonts (Lora, Caveat, Inter), metadata
│   ├── page.tsx                # Landing page composing header, sections, and footer
│   ├── globals.css             # Design tokens, Tailwind directives, accurate typography & utility layer
│   ├── actions.ts              # Direct Server Actions for waitlist & clinician lead submission
│   ├── not-found.tsx           # 404 handler
│   └── error.tsx               # Error boundary
├── components/
│   ├── ui/                     # Reusable atomic UI primitives
│   │   ├── button.tsx          # Pill/rounded variants, sizes, icon support
│   │   ├── badge.tsx           # Pill badges (Understand, Nurture, Empower, Clinical tags)
│   │   ├── card.tsx            # Base card, feature card, testimonial card
│   │   ├── section-header.tsx  # Caveat script eyebrow + Lora serif heading
│   │   ├── accordion.tsx       # Accessible FAQ accordion with smooth open/close
│   │   ├── input.tsx           # FormField, Input, and Select primitives
│   │   └── container.tsx       # Responsive max-width container
│   ├── layout/                 # Layout shell components
│   │   ├── site-header.tsx     # Brand logo, nav links, mobile drawer, CTA
│   │   └── site-footer.tsx     # SVG dual-curve wave, navigation, newsletter, copyright
│   ├── sections/               # Page sections composed using UI primitives
│   │   ├── hero.tsx            # Hero visual art, pills, quote, action buttons
│   │   ├── empathy.tsx         # Empathy problem narrative, guiding principle pull-quote
│   │   ├── feature-grid.tsx    # 4 foundational care cards with colored icon badges
│   │   ├── how-it-works.tsx    # 4-step workflow + phone mockup + parent testimonial card
│   │   ├── clinicians.tsx      # Exact Clinicians card (avatar, quote, badges, tags)
│   │   ├── trust.tsx           # Trust & Ethics compliance checklist card
│   │   ├── closing.tsx         # Nest branches visual, community items, join CTA card
│   │   ├── lead-forms.tsx      # Parent waitlist form + Clinician registration form
│   │   └── faq.tsx             # Interactive FAQ accordion
│   └── interactive/
│       ├── phone-mock.tsx      # iOS mockup with status bar, today's focus, tabs
│       ├── progress-ring.tsx   # SVG animated circle progress indicator (72%)
│       └── motion-reveal.tsx   # Motion scroll entrance wrapper
├── lib/
│   ├── content.ts              # Fully typed site copy & configuration
│   ├── schemas.ts              # Zod schemas for forms
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
public/
└── assets/                     # Static images and icons
```

## Data Flow

```
LeadForms / Newsletter (Client, useActionState)
  └─▶ Server Actions (src/app/actions.ts)
        └─▶ Zod Schema Validation (src/lib/schemas.ts)
              ├─▶ Error: Return field-level errors & feedback
              └─▶ Success: Return confirmation state
```