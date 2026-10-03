# Architecture

> How the NeuroNest frontend is organised. Rules for writing code are in [conventions.md](conventions.md).

## Design decisions

| Decision | Rationale |
| --- | --- |
| **Component-driven composition** | Atomic primitives in `src/components/ui/` are composed into page sections in `src/components/sections/`. |
| **Server Components by default** | The landing site is server-rendered for performance and SEO. Interactivity (header drawer, forms, accordion, motion, splash) uses `"use client"`. |
| **Content as data** | All marketing copy lives in `src/content/*.ts`; `src/lib/content.ts` re-exports it for backward compatibility. |
| **Direct Server Actions + Zod** | `src/app/actions.ts` validates with schemas from `src/lib/schemas.ts`. No repository layers or fake adapters. |
| **CSS custom-property tokens** | Design tokens live in `src/app/globals.css`; see [design-system.md](design-system.md). |

## Directory structure

```
src/
├── app/
│   ├── layout.tsx              # Root shell: Lora/Caveat/Inter, metadata, SplashScreen, JSON-LD
│   ├── page.tsx                # Landing page
│   ├── for-parents/ for-clinicians/ how-it-works/ faq/ privacy/   # one page.tsx each
│   ├── globals.css             # Tokens, element resets, landing component classes
│   ├── actions.ts              # Server Actions (parent waitlist, clinician signup, newsletter)
│   ├── robots.ts  sitemap.ts   # Generated robots.txt / sitemap.xml (currently host-unaware)
│   ├── not-found.tsx  error.tsx
│   └── favicon.ico
├── components/
│   ├── ui/                     # button, badge, card, section-header, accordion, input, container
│   ├── layout/                 # site-header, site-footer, splash-screen
│   ├── sections/               # hero, empathy, feature-grid, how-it-works, clinicians, trust, closing, lead-forms, faq
│   ├── interactive/            # phone-mock, progress-ring, motion-reveal
│   └── seo/                    # json-ld
├── content/                    # home, for-parents, for-clinicians, how-it-works, faq, privacy, site, index (barrel)
└── lib/                        # content (barrel), schemas, seo, theme, utils
public/assets/                  # Static images and icons
docs/                           # This documentation
```

Pages import `SiteHeader` / `SiteFooter` themselves and render `<main id="main">`; the root layout only provides the shell.

## Data flow (forms)

```
LeadForms / Newsletter (client, useActionState)
  └─▶ Server Action (src/app/actions.ts)
        └─▶ Zod schema (src/lib/schemas.ts)
              ├─▶ invalid: FormState with field errors + submitted values
              └─▶ valid:   forward to Google Sheets webhook (if configured) → FormState success
```

## Planned: Admin application

A separate Admin app (`admin.*` host, own root layout, BFF auth) is planned inside this same Next app. Nothing of it exists yet; the design and milestone checklist are in [plans/0001-admin-app.md](plans/0001-admin-app.md). When it lands, update this file with the real route-group layout.
