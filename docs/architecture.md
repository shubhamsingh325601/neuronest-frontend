# Architecture

> How the NeuroNest frontend is organised. Rules for writing code are in [conventions.md](conventions.md).

## Design decisions

| Decision | Rationale |
| --- | --- |
| **Component-driven composition** | Atomic primitives in `src/components/ui/` are composed into page sections in `src/components/sections/`. |
| **Server Components by default** | The landing site is server-rendered for performance and SEO. Interactivity (header drawer, forms, accordion, motion, splash) uses `"use client"`. |
| **Content as data** | All marketing copy lives in `src/content/*.ts`; `src/lib/content.ts` re-exports it for backward compatibility. |
| **Direct Server Actions + Zod** | `src/app/actions.ts` validates with schemas from `src/lib/schemas.ts`. No repository layers or fake adapters. |
| **CSS custom-property tokens** | Design tokens live in `src/app/(public)/globals.css`; see [design-system.md](design-system.md). |

## Directory structure

```
src/
├── app/
│   ├── (public)/               # Landing site. Its own ROOT layout (route group, URLs unchanged)
│   │   ├── layout.tsx          # Root shell: Lora/Caveat/Inter, metadata, SplashScreen, JSON-LD
│   │   ├── globals.css         # Tokens, element resets, landing component classes (imported only here)
│   │   ├── page.tsx            # Landing page
│   │   ├── for-parents/ for-clinicians/ how-it-works/ faq/ privacy/   # one page.tsx each
│   │   ├── [...slug]/page.tsx  # Calls notFound() so unmatched URLs render the landing 404
│   │   └── not-found.tsx  error.tsx
│   ├── (admin)/                # Admin app. A second ROOT layout: no landing CSS, fonts, JSON-LD or splash
│   │   ├── layout.tsx          # Bare <html>/<body>, noindex metadata
│   │   └── admin/              # Internal URL prefix; invisible on the admin host (see Host routing)
│   │       ├── (auth)/         # login, forgot-password, reset-password, complete-account-setup, session-error
│   │       ├── (console)/      # Shell layout (force-dynamic, requireAdmin()) + one thin page per nav route,
│   │       │                   # loading / error / not-found / [...slug] rendered inside the shell
│   │       └── api/            # BFF: backend/[...path] (allowlisted proxy), auth/refresh, auth/session-ended
│   ├── actions.ts              # Server Actions (parent waitlist, clinician signup, newsletter)
│   ├── robots.ts  sitemap.ts   # Public-host robots.txt / sitemap.xml (admin host is handled in proxy.ts)
│   └── favicon.ico
├── proxy.ts                    # Host routing (Next 16 "proxy", formerly middleware)
├── components/
│   ├── ui/                     # button, badge, card, section-header, accordion, input, container
│   ├── layout/                 # site-header, site-footer, splash-screen
│   ├── sections/               # hero, empathy, feature-grid, how-it-works, clinicians, trust, closing, lead-forms, faq
│   ├── interactive/            # phone-mock, progress-ring, motion-reveal
│   └── seo/                    # json-ld
├── content/                    # home, for-parents, for-clinicians, how-it-works, faq, privacy, site, index (barrel)
├── lib/                        # content (barrel), schemas, seo, theme, utils, host (pure host/path routing logic)
└── modules/admin/              # Admin code; must not import landing code
    ├── styles/admin.css        # Admin tokens (light/dark), @theme inline; Tailwind scan limited to admin code
    ├── theme/                  # ThemeProvider, pre-paint script, contrast test
    ├── ui/                     # Primitives on radix-ui + cva (Button ... Sheet, Toaster)
    ├── notifications/toast.ts  # Only importer of sonner
    ├── providers/              # Client providers for the admin root layout
    ├── app-shell/              # AdminShell, Sidebar, SidebarNav, MobileDrawer, Topbar, UserMenu, PageHeader, states, MockDataChip
    ├── navigation/             # nav-config (typed tree), paths, breadcrumbs registry + component
    ├── state/                  # ui-store (Zustand), sidebar-pref (persisted collapse + pre-paint script)
    ├── auth/                   # Server Actions, session (requireAdmin), cookies, refresh single-flight, proxy gate, SessionKeeper, auth screens
    ├── bff/                    # /api/backend handler: allowlist, CSRF guards
    ├── lib/                    # http core, api-client / server-api, api-errors, query-client, query-keys, pagination (useCursorList), describe-error, format
    ├── config/                 # env.ts (zod, server-only), data-source.ts (live|mock flags, production guard), shell-stub.ts (mocked sources for the MockDataChip)
    └── features/               # dashboard, system (api/ seam + hooks/ + components/), placeholder (content + PlaceholderPage)
src/mocks/admin/                # Mock XApi implementations + _factory.ts (only imported dynamically, behind data-source flags)
public/assets/                  # Static images and icons
scripts/                        # measure-landing-js.mjs (landing client-JS baseline)
docs/                           # This documentation (docs/baselines/ holds the landing JS baseline)
```

Pages import `SiteHeader` / `SiteFooter` themselves and render `<main id="main">`; the public root layout only provides the shell.

## Data flow (forms)

```
LeadForms / Newsletter (client, useActionState)
  └─▶ Server Action (src/app/actions.ts)
        └─▶ Zod schema (src/lib/schemas.ts)
              ├─▶ invalid: FormState with field errors + submitted values
              └─▶ valid:   forward to Google Sheets webhook (if configured) → FormState success
```

## Host routing and the Admin app

One Next app serves two hosts. `src/proxy.ts` (decisions in `src/lib/host.ts`, unit tested) classifies the `Host` header:

- **Admin host** (`admin.*`, or any name in `ADMIN_HOSTS`): every path `p` is rewritten to `/admin${p}`, so `admin.localhost:3001/` renders `(admin)/admin/page.tsx`. `/robots.txt` is `Disallow: /`, `/sitemap.xml` is 404, every response carries `X-Robots-Tag: noindex, nofollow`, and a literal `/admin/*` request is 404. Paths outside the auth allowlist also pass the optimistic session gate (cookie presence only; see [data-layer.md](data-layer.md)).
- **Public host**: `/admin`, `/admin/*` and `/api/admin/*` are 404; everything else is untouched.

Import boundaries are enforced by ESLint (`no-restricted-imports` in `eslint.config.mjs`): public code (`(public)`, `components`, `content`, `lib`) cannot import `@/modules/admin`, `@/mocks` or `@/app/(admin)`; admin code cannot import `@/components`, `@/content`, `@/app/(public)`, `@/app/actions` or any `@/lib/*` except `@/lib/utils`. The rule matches `@/` alias imports (the repo convention), not relative paths.

CSS isolation: both stylesheets use `@import "tailwindcss" source(none)` plus explicit `@source` roots (landing: `(public)`, `components`, `content`, `lib`; admin: `modules/admin`, `app/(admin)`, `mocks`). Without this Tailwind's automatic scanning generated admin utilities into the landing CSS. Keep the two lists disjoint when adding folders. The admin `next/font` Inter uses a different variable name and `fallback` from the landing's so Turbopack does not merge the two roots' font CSS.

Dev: `npm run dev` serves on port **3001**; open `http://admin.localhost:3001` for the Admin app (`allowedDevOrigins` allows that origin). `npm run test` runs Vitest (node environment). `node scripts/measure-landing-js.mjs --check docs/baselines/landing-js.json` (after `npm run build`) compares the landing's client JS with the baseline.

Design and milestone checklist: [plans/0001-admin-app.md](plans/0001-admin-app.md).

## Admin shell

- **Responsive:** >= lg sidebar expanded or user-collapsed (persisted in `localStorage`, key `nn-admin-sidebar`); md to lg a fixed icon rail; < md an off-canvas drawer (Radix Dialog, focus-trapped). Width and labels are driven by CSS on `html[data-sidebar]`, set by a pre-paint script, so reloads never flash the wrong state. Zustand mirrors the flag for tooltips and the toggle.
- **Paths:** behind the proxy rewrite `usePathname()` can differ from the browser URL and prerendered pages risk hydration mismatches, so the console layout is `force-dynamic` and all path comparisons go through `normalizeAdminPath` (strips the internal `/admin`). Unknown URLs render the console 404 inside the shell but with status 200 (the shell streams first); the admin host is noindex everywhere, so this is harmless.
- **Adding a page:** add a leaf to `navigation/nav-config.ts`, a pattern to `navigation/breadcrumbs/registry.ts` and a thin `page.tsx` under `(console)`; a unit test fails if a nav route has no page or no breadcrumb.
- **Session:** `(console)/layout.tsx` awaits `requireAdmin()` (the real guard; see [data-layer.md](data-layer.md) "Admin auth") and mounts `SessionKeeper`. A redirect in the layout does not stop a page component rendering in parallel, so pages must not rely on it to protect data; data goes through the BFF, which has no cookie-less path.
- **Temporary:** the search dialog and the notification sheet are placeholders; `MockDataChip` lists them (`config/shell-stub.ts`). M5 replaces them.
