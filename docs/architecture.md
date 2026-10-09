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
│   │   └── admin/              # The real URL prefix: /admin (see Admin at /admin)
│   │       ├── (auth)/         # login, forgot-password, reset-password, complete-account-setup, session-error
│   │       ├── (console)/      # Shell layout (force-dynamic, requireAdmin()) + one thin page per nav route,
│   │       │                   # loading / error / not-found / [...slug] rendered inside the shell
│   │       └── api/            # BFF: backend/[...path] (allowlisted proxy), auth/refresh, auth/session-ended
│   ├── actions.ts              # Server Actions (parent waitlist, clinician signup, newsletter)
│   ├── robots.ts  sitemap.ts   # robots.txt (Disallow: /admin) / sitemap.xml (public URLs only)
│   └── favicon.ico
├── proxy.ts                    # /admin only: headers + optimistic session gate (Next 16 "proxy", formerly middleware)
├── components/
│   ├── ui/                     # button, badge, card, section-header, accordion, input, container
│   ├── layout/                 # site-header, site-footer, splash-screen
│   ├── sections/               # hero, empathy, feature-grid, how-it-works, founder, clinicians, trust, closing, lead-forms, faq
│   ├── interactive/            # phone-mock, progress-ring, motion-reveal
│   └── seo/                    # json-ld
├── content/                    # home, founder, for-parents, for-clinicians, how-it-works, faq, privacy, site, index (barrel)
├── lib/                        # content (barrel), schemas, seo, theme, utils, 
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

## Admin at `/admin` (same origin)

The Admin app is served at `/admin` on the same origin as the landing site (decision 2026-10-05: no second domain on the free Vercel plan; plan [0002-admin-path-routing.md](plans/0002-admin-path-routing.md)). There is no host routing and no rewrite: `src/app/(admin)/admin/...` is the real URL. The landing's static `/` and `[...slug]` routes never see `/admin/*` (a static segment outranks the catch-all), and `/adminx` or `/ADMIN` are not admin routes.

`src/proxy.ts` returns immediately for every path outside `/admin`, so landing responses are untouched. For `/admin/*` it adds `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin` and a per-request **nonce CSP** (`modules/admin/security/csp.ts`: `script-src 'self' 'nonce-…' 'strict-dynamic'`, no `unsafe-inline` for scripts, `frame-ancestors 'none'`, nothing third-party), then runs the optimistic session gate (cookie presence only; see [data-layer.md](data-layer.md)) and forwards the requested path in `x-nn-path`. Matching is done on a decoded, slash-collapsed, lower-cased path (`/%61dmin`, `//admin`). `robots.ts` disallows `/admin`; `sitemap.ts` never lists it.

**CSP rules:** the admin root layout is `force-dynamic` and stamps its two inline pre-paint scripts with the proxy's `x-nonce`; Next stamps its own scripts from the request's CSP header. Adding a third-party script, an inline `<script>` or an external origin to admin means updating `csp.ts` deliberately. `style-src` keeps `'unsafe-inline'` because React/Radix/sonner emit `style=""` attributes. The landing site has no CSP.

**URLs in code:** every admin path is the full browser path, built from `modules/admin/navigation/paths.ts` (`adminPath()`, `ADMIN_ROUTES`). Never hand-write `/login` or `/users`: a test (`literal-paths.test.ts`) fails on a root-relative literal outside `/admin`.

Import boundaries are enforced by ESLint (`no-restricted-imports` in `eslint.config.mjs`): public code (`(public)`, `components`, `content`, `lib`) cannot import `@/modules/admin`, `@/mocks` or `@/app/(admin)`; admin code cannot import `@/components`, `@/content`, `@/app/(public)`, `@/app/actions` or any `@/lib/*` except `@/lib/utils`. The rule matches `@/` alias imports (the repo convention), not relative paths.

CSS isolation: both stylesheets use `@import "tailwindcss" source(none)` plus explicit `@source` roots (landing: `(public)`, `components`, `content`, `lib`; admin: `modules/admin`, `app/(admin)`, `mocks`). Without this Tailwind's automatic scanning generated admin utilities into the landing CSS. Keep the two lists disjoint when adding folders. The admin `next/font` Inter uses a different variable name and `fallback` from the landing's so Turbopack does not merge the two roots' font CSS.

Dev: `npm run dev` serves on port **3001**; the landing is `http://localhost:3001` and the Admin app `http://localhost:3001/admin`. `npm run test` runs Vitest (node environment). `node scripts/measure-landing-js.mjs --check docs/baselines/landing-js.json` (after `npm run build`) compares the landing's client JS with the baseline.

Design and milestone checklist: [plans/0001-admin-app.md](plans/0001-admin-app.md).

## Admin shell

- **Responsive:** >= lg sidebar expanded or user-collapsed (persisted in `localStorage`, key `nn-admin-sidebar`); md to lg a fixed icon rail; < md an off-canvas drawer (Radix Dialog, focus-trapped). Width and labels are driven by CSS on `html[data-sidebar]`, set by a pre-paint script, so reloads never flash the wrong state. Zustand mirrors the flag for tooltips and the toggle.
- **Paths:** `usePathname()` is the real `/admin/...` path (no rewrite). The console layout is `force-dynamic` because it reads cookies; active-state comparisons use full paths via `isPathActive`. Unknown URLs render the console 404 inside the shell but with status 200 (the shell streams first); Admin is noindex everywhere, so this is harmless, and anonymous visitors are redirected to login before they see it.
- **Adding a page:** add a leaf to `navigation/nav-config.ts`, a pattern to `navigation/breadcrumbs/registry.ts` and a thin `page.tsx` under `(console)`; a unit test fails if a nav route has no page or no breadcrumb.
- **Session:** `(console)/layout.tsx` awaits `requireAdmin()` (the real guard; see [data-layer.md](data-layer.md) "Admin auth") and mounts `SessionKeeper`. A redirect in the layout does not stop a page component rendering in parallel, so pages must not rely on it to protect data; data goes through the BFF, which has no cookie-less path.
- **Temporary:** the search dialog and the notification sheet are placeholders; `MockDataChip` lists them (`config/shell-stub.ts`). M5 replaces them.
