# Plan 0001 — Admin Application

> **Status: APPROVED — M0 to M4 implemented, awaiting review; M5 not started.** Work one milestone at a time and stop after each for review. Tick boxes as work lands: `[ ]` not started · `[x]` done.
> Scope: the Admin app only. Parent and Clinician apps are out of scope. The landing site must not change behaviour.

## Guardrails (from plan review)

- Backend gaps are acceptable for V1. Do not reopen backend work unless implementation hits a genuine blocker; raise it instead of working around it silently.
- The backend owner will supply the final API routes, schemas and models. Until then, §1's capability map and the DTO shapes in this plan are **provisional**. Re-check them against the supplied contract before M3 (auth) and M4 (data layer).
- Keep test infrastructure small; it must not become a project of its own.
- Do not introduce: microfrontends, Redis, another auth provider, another UI framework, generic enterprise state management, generic analytics infrastructure, backend redesign, or unnecessary API additions.

## Checklist

### Decisions (approved in plan review)

- [x] BFF auth: tokens in httpOnly cookies, server-side calls (no backend changes) — see §16
- [x] Move landing files into a `(public)` route group so admin gets its own root layout — see §2
- [x] Local ports: Next on `3001`, admin at `http://admin.localhost:3001`; backend moved off :3000 (e.g. `PORT=4000`) — see §3
- [x] Hand-rolled theme provider (no `next-themes`); admin primitives in `modules/admin/ui` (not the landing ones) — see §7, §8
- [x] Reconcile UX with the reference screenshot (received in M2: grouped sidebar with tinted active item and accent bar, search-led topbar, brand-coloured lead card; adopted with accessibility additions)

### M0 — Foundations & isolation

- [x] Install only what M0 needs (`vitest`). Every other dependency (`@tanstack/react-query`, `zustand`, `sonner`, `cmdk`, `radix-ui`, `class-variance-authority`, `server-only`, …) is installed in the milestone that first uses it
- [x] `git mv` landing routes into `src/app/(public)/`; move root `layout.tsx` → `(public)/layout.tsx`
- [x] `(public)/[...slug]/page.tsx` calling `notFound()`; move `not-found.tsx` / `error.tsx` into `(public)`
- [x] `(admin)/layout.tsx` root layout + placeholder `/` page
- [x] `src/proxy.ts`: host classification + admin rewrite to `/admin/*`; public host `/admin*` → 404
- [x] Admin host: `robots.txt` Disallow, `sitemap.xml` 404, `X-Robots-Tag: noindex`
- [x] `allowedDevOrigins: ['admin.localhost']`; `next dev -p 3001`
- [x] ESLint boundary rules (public ⛔ admin, admin ⛔ landing components/content)
- [x] Vitest (node environment) + `test` script, with unit tests for the proxy host/path decisions. Keep test infra minimal: RTL arrives with the first component test, Playwright in M11
- [x] Record the landing client-JS baseline for `/` and confirm it is unchanged after the move. Next 16 no longer prints "First Load JS" in `next build`, so measure it with a small script over `.next` build artifacts (or `next experimental-analyze --output`) and commit the baseline file
- [x] Verify: `localhost:3001` landing identical; `admin.localhost:3001` shows admin stub; `/admin` on public host = 404

### M1 — Tokens, theme, primitives v1

- [x] Gate: before installing `radix-ui` / `class-variance-authority`, confirm with the reviewer that copy-in Radix primitives count as primitives, not "another UI framework". If not, build the few primitives needed by hand
- [x] `admin.css`: light + dark semantic tokens, `@theme inline`, `@custom-variant dark`
- [x] Theme provider (`light | dark | system`) + pre-paint script, no flash on reload
- [x] Contrast unit test for key token pairs (AA)
- [x] Primitives: Button, Input, Field, Card, Badge, StatusBadge, Skeleton, Tooltip, Dialog, ConfirmDialog, DropdownMenu, Sheet
- [x] Sonner toaster + `toast.ts` wrapper
- [x] Lint check: no hex colours / arbitrary colour classes in `modules/admin`

### M2 — Shell

- [x] `nav-config.ts` (typed tree, `status: live | placeholder`, badge keys)
- [x] Sidebar: groups, submenu, active state, collapse (persisted), icon-only mode + tooltips
- [x] Mobile drawer (focus-trapped); tablet rail
- [x] Topbar: toggle, breadcrumbs, search trigger, bell, theme control, user menu
- [x] `PageHeader`, `LoadingState`, `EmptyState`, `ErrorState`
- [x] Breadcrumb registry + `<Breadcrumbs>` (static labels)
- [x] `ui-store` (Zustand): `sidebarCollapsed`, `mobileNavOpen`, `commandOpen`, `notificationsOpen`
- [x] `MockDataChip` shown whenever a mock source is active
- [x] Console-level `loading.tsx`, `error.tsx`, `not-found.tsx`, `[...slug]`
- [x] Every nav route has a placeholder page, honestly labelled

### M3 — Auth & session (live backend)

- [x] `config/env.ts` (zod-validated) and `.env.example` additions (names only)
- [x] `server-api.ts` + `api-errors.ts` (problem+json → `ApiError`)
- [x] Cookie helpers (`__Host-` names in prod, host-only, httpOnly, SameSite=Lax)
- [x] Login Server Action: login → `/users/me` → require `ADMIN` + `ACTIVE`, else revoke token and show error
- [x] `getSession()` / `requireAdmin()` (server-only, `React.cache`) in `(console)/layout.tsx`
- [x] `/api/backend/[...path]` BFF handler: allowlist, bearer injection, CSRF checks
- [x] `/api/auth/refresh`: single-flight + short old→new memo; proxy never refreshes
- [x] `SessionKeeper` (proactive refresh, `navigator.locks` across tabs); prefetch requests ignored
- [x] Proxy optimistic gate (cookie presence only) + `next` redirect validation
- [x] Pages: login, forgot-password, reset-password, complete-account-setup (login UI already built in M1 at `modules/admin/auth/`, not wired; M3 replaces `handleSubmit` with the Server Action)
- [x] Cases: unauthenticated · non-admin · expired · suspended (`ACCOUNT_NOT_ACTIVE`) · 429 · logout · init skeleton
- [x] `INVALID_CREDENTIALS` treated as a form error, never as session expiry
- [x] Unit tests: refresh single-flight, BFF allowlist/CSRF, proxy matrix

M3 notes (where the build differs from §16, all small):
- Server Components cannot set cookies, so a forced sign-out (suspended / not an admin) is a redirect to `GET /api/auth/session-ended?reason=`, which clears the cookies and lands on `/login?reason=`; there is no separate "no admin access" screen. A non-admin is normally stopped at login (revoked, form error).
- A refresh that is throttled (429) or fails because the backend is down keeps the session and goes to a `/session-error` page (countdown, retry, sign out). Sending it to `/login` would loop through the proxy's "signed-in user on /login" bounce.
- `/login?reason=...` is never bounced by the proxy (loop guard). A refresh token the backend rejects as malformed (`VALIDATION_ERROR`) counts as an expired session.
- The proxy forwards the browser-visible path in `x-nn-path` so the layout can build `next` for the refresh redirect.

### M4 — Data layer, Dashboard, System

- [x] `QueryClient` defaults, query-key factories, `useCursorList` (infinite query helper)
- [x] `XApi` interface + `live.ts` + mock factory (`mocks/admin/_factory.ts`), `data-source.ts` flags
- [x] Production build refuses mock sources unless `ALLOW_ADMIN_MOCKS=1`
- [x] Dashboard: 6 summary cards (live), quick actions, system status card, activity feed placeholder
- [x] System page: `/health` polling, 503 shown as degraded/down; AI observability placeholder

M4 notes:
- The backend already ships `invitedClinicians` (and an extra `deadJobs`, unused), so no mocked summary field was needed.
- The mock selectors are `NEXT_PUBLIC_ADMIN_DATA_SOURCE` / `NEXT_PUBLIC_ADMIN_MOCK_FEATURES` (plan §18 said `ADMIN_MOCK_FEATURES`): hooks run in the browser. `next.config.ts` pins both so live bundles drop the mock imports.
- `ApiError` gained an optional `body` so the health service can read a 503 health report.
- Live-verified 2026-10-04: login, System page (operational). The dev backend answered `GET /v1/admin/summary` with 500 `INTERNAL_ERROR`, so the dashboard's live success path was checked with the mock source and unit tests only; the live error state was verified.

### M5 — Search & notifications

- [ ] `SearchProvider` interface; navigation + actions providers; `useAdminSearch`
- [ ] Command palette (cmdk, lazy), ⌘/Ctrl+K and `/` shortcuts, focus restore
- [ ] `NotificationSource` interface + mock source; bell + drawer with "sample data" label
- [ ] Sidebar badge only if a real actionable count exists (the application queue no longer exists); otherwise drop

### M6 — Clinicians

- [ ] Clinician directory (`GET /clinicians`, `?status=` and `?q=` once released) with load more
- [ ] Invite clinician (`POST /clinicians`: name, email, optional profile); handle `EMAIL_ALREADY_REGISTERED`; invitation email is best-effort, so show the invite as created either way
- [ ] Resend invitation while INVITED (`CLINICIAN_NOT_INVITED` otherwise); edit name / profile; email editable only while INVITED (`CLINICIAN_EMAIL_LOCKED`)
- [ ] Clinician list (client-side filter) and detail (via `/users/{id}` + assigned children)
- [ ] Suspend / reactivate with confirm
- [ ] Empty/loading/error states; tests

### M7 — Users

- [ ] Directory with role tabs and status filter; load more
- [ ] User detail (child link / assigned children); suspend / reactivate; own account disabled
- [ ] Entity-directory hook (id → name) with long `staleTime`
- [ ] Empty/loading/error states; tests

### M8 — Children

- [ ] Children list (age from DOB, parent name via directory hook) and detail shell with tabs
- [ ] Care team tab: assign (ACTIVE-clinician picker), revoke; `CLINICIAN_ALREADY_ASSIGNED` handling
- [ ] Plans tab (history, status filter, plan detail + notes read-only)
- [ ] Media tab (grid, `playbackUrl` null states, lazy viewer)
- [ ] Call history tab (read-only)
- [ ] Empty/loading/error states; tests

### M9 — Plan templates

- [ ] List (client-side status filter) and detail (days)
- [ ] Create builder (lazy, RHF + zod mirroring backend limits, contiguous `dayNumber`s)
- [ ] Publish (one-way confirm) and Archive (terminal confirm)
- [ ] Empty/loading/error states; tests

### M10 — Profile, Settings, Help

- [ ] Profile from `/users/me`; change password (10–128 chars) → clears session → login
- [ ] Settings: appearance (theme, sidebar default)
- [ ] Help: placeholder docs/FAQ + support contact

### M11 — Hardening

- [ ] Axe checks on key pages; keyboard walkthrough (sidebar, palette, dialogs)
- [ ] Responsive pass on every table (card layout below `md`)
- [ ] Playwright e2e suite (host routing, auth gate, core flows, theme, mobile drawer)
- [ ] Bundle guard script (`/` client JS vs the M0 baseline)
- [ ] Write `docs/admin.md` (runbook) and update AGENTS.md routing table
- [ ] Production checklist: second domain on the Vercel project, env vars, `APP_WEB_URL` for reset links

## Contract check — 2026-10-04 (OpenAPI snapshot + backend repo)

The backend owner supplied `api-1.json` (OpenAPI 3.0, `/v1`). The sibling repo (`../neuro-nest-backend`, uncommitted Phase 10 work) is **ahead** of that snapshot; where they differ the repo is noted separately. The backend is still changing, so treat every item as provisional until released.

**Confirmed unchanged:** auth routes and DTOs (`SessionTokensDto { accessToken, refreshToken, tokenType, expiresIn }`), the cursor envelope `{ data, nextCursor }`, ProblemDetails (`code`, `requestId`, `errors[]`), `/users` (`role` and `status` filters), `/children`, care team, plan templates (no status filter, `days` included in list rows), per-child plans / notes / media / call logs, `/admin/summary`, public `/health`.

**Deltas that affect this plan**

| # | Finding | Impact |
|---|---|---|
| 1 | User status enum is `ACTIVE, SUSPENDED, DEACTIVATED, INVITED` (the plan assumed no DEACTIVATED). Reactivate works from SUSPENDED and DEACTIVATED; suspend from ACTIVE and INVITED. | StatusBadge updated; M6/M7 action rules |
| 2 | Application status enum has `REVIEWED`, which no backend code sets. | Treat as display-only |
| 3 | Reset uses `newPassword`; account setup uses `password`; change-password uses `currentPassword` + `newPassword`. Backend validation is `forbidNonWhitelisted`, so send only documented fields. | M3 form actions |
| 4 | Spec paths already include `/v1`, so `API_BASE_URL` is the **origin** (e.g. `http://localhost:4000`), not `.../v1`. The backend defaults to port 3000. | M3 env |
| 5 | **Auth throttle is 5 req / 60 s on every `/v1/auth/*` route, refresh and logout included.** Originally per client IP; **changed 2026-10-04 to per identity** (user, else email, else token in the body). The BFF no longer forwards `X-Forwarded-For`; 429 shows a countdown and disables submit. | M3 |
| 6 | `GET /v1/health` is untyped in the spec; the repo returns `{ status: "ok"/"degraded", db: "up"/"down", uptime (seconds), timestamp }` and **503** when the DB is down. | M4 system page |
| 7 | The backend now has CORS (`CORS_ORIGINS`). The BFF still avoids it. | none |
| 8 | Error codes in backend source that matter here: `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED` (403), `ACCOUNT_NOT_ACTIVE` (403), `INVALID_REFRESH_TOKEN`, `INVALID_TOKEN`, `MISSING_TOKEN`, `INSUFFICIENT_PERMISSIONS`, `RATE_LIMITED`, `INVALID_RESET_TOKEN`, `INVALID_SETUP_TOKEN`, `VALIDATION_ERROR`, `CANNOT_SUSPEND_SELF`, `INVALID_STATUS_TRANSITION`, `CLINICIAN_ALREADY_ASSIGNED`, `CLINICIAN_NOT_ACTIVE`, `CLINICIAN_NOT_FOUND`, `CHILD_NOT_FOUND`. The plan's `APPLICATION_DECISION_FINAL` does not appear in source. | M3 error map; M6 |

**Decided 2026-10-04 (owner): build toward backend Phase 10.** There is no application flow; clinicians are invited by an admin. M2 nav, dashboard and placeholders were updated accordingly. Applications return only if the owner adds a public form later. Details of the Phase 10 change:

**Backend Phase 10 (in the repo, not yet in the spec)** replaces the application flow with admin-created clinicians: `POST /clinicians` (creates an INVITED clinician and emails a setup link), `GET /clinicians/{id}`, `PATCH /clinicians/{id}`, `POST /clinicians/{id}/resend-invitation` and `GET /clinicians?status=&q=`. The five `/clinician-applications` routes are **removed**, and `/admin/summary` swaps `pendingClinicianApplications` for `invitedClinicians`. If this ships, the Applications nav item, the review queue (M6), the "pending applications" dashboard card and the sidebar badge key all change. **Dependency:** M4 and M6 need the Phase 10 routes and the new summary field released; until then they use mocks.

## 0. Context

The landing site (Next.js 16.3.4, App Router) exists. The Admin app lives in the **same repo and Next app**, is served from `admin.neuronest…`, enters directly into an authenticated console, shares no chrome/CSS/JS with the landing page, and talks to the finished NestJS backend (`../neuro-nest-backend`, `/v1`).

Two findings shape everything:

1. **Landing global CSS and root layout are unsafe to share.** `globals.css` has bare-element resets, `body { overflow-x: hidden }`, `main > section` padding, a global `:focus-visible`, generic classes (`.btn`, `.panel`, `.container`), no `@theme`, no dark mode. The root layout mounts `SplashScreen`, Organisation JSON-LD and a pre-paint splash script.
2. **Backend auth is bearer-only with a rotating refresh token; no CORS, no cookies.** Reusing a rotated refresh token revokes the whole session family, and `/v1/auth/*` is throttled at 5 req/60 s. A Next.js BFF (tokens in httpOnly cookies, server-side calls) fits and needs zero backend changes.

## 1. Existing frontend findings

| Area | Finding |
|---|---|
| Framework | Next 16.3.4, App Router only, React 19.2.8, TS 5 strict, alias `@/* → src/*` |
| Next 16 specifics | `middleware.ts` is now **`proxy.ts`** (Node runtime, no `runtime` option). `global-not-found` is experimental (avoid). Dev cross-origin needs `allowedDevOrigins`. |
| Styling | Tailwind v4 (`@import "tailwindcss"` only); tokens are plain `:root` vars + semantic CSS classes; no `@theme`, no dark mode |
| UI | `src/components/ui/*` wrap landing CSS classes. No Dialog, Table, Tabs, Menu, Toast, status badge, destructive variant. Only `cn()` and `lucide-react` are cleanly reusable |
| Libraries | None installed for state, data, auth or toasts |
| Forms | zod 4 + Server Actions returning `FormState` — reusable for login / change-password |
| Routing / host | No proxy, no rewrites, empty `next.config.ts`; `robots.ts` / `sitemap.ts` allow-all and host-unaware |
| Tests | None. Quality gate: typecheck → build |

### Backend capability map (source of truth)

**Exists:** auth (login / refresh / logout / change-password / forgot / reset), `GET /users/me`, `GET /admin/summary` (6 counts), clinician-applications (list + status filter / get / approve / reject), `GET /clinicians` (cursor only), users (list `role`,`status` / get / suspend / reactivate), children (list / get), care team (list / assign / revoke), plan-templates (list / get / create / publish / archive), per-child plans / notes / media / call-logs (read; admin can also write plans, notes, calls), `GET /health` (public).

**Does not exist:** `GET /clinicians/{id}`, any search or sort, total counts, status filter on clinicians / children / templates, parent filter on children, template edit / delete, resend setup link, notifications, settings, profile update, audit / activity feed, metrics beyond `/health`, admin-wide plans / media / call lists, CORS, cookies.

Pagination is **cursor-only** (`{data, nextCursor}`, limit ≤ 100): no page numbers, "load more" UX.

## 2. Architecture

One Next app, **two root layouts via route groups** → two separate trees (CSS, JS chunks, fonts, `<html>`).

```
src/app/
  (public)/        root layout: fonts, globals.css, SplashScreen, JSON-LD; all existing landing routes moved here (URLs unchanged)
    not-found.tsx, error.tsx, [...slug]/page.tsx (notFound())
  (admin)/
    layout.tsx     root layout: Inter only, admin.css, theme script, <Providers>
    admin/         internal URL prefix, invisible on the admin host
      (auth)/      login, forgot-password, reset-password, complete-account-setup
      (console)/   layout (session guard + AdminShell), dashboard, clinicians, users, children,
                   plan-templates, system, help, settings, profile, loading/error/not-found/[...slug]
      api/         BFF route handlers
  robots.ts, sitemap.ts, favicon.ico   (host-aware robots)
src/proxy.ts
src/modules/admin/    all admin code (§6)
src/mocks/admin/      all temporary static data (§18)
```

Landing impact: **file moves only** — no component changes, same URLs. Verified by the `next build` route table and a diff of `/` client JS against the M0 baseline (Next 16 does not print First Load JS, see M0).

## 3. Public vs Admin host strategy (`src/proxy.ts`)

- `isAdminHost(hostname)`: strips port; true if in `ADMIN_HOSTS` (comma list env) **or** starts with `admin.`.
- **Admin host:** rewrite every path `p` → `/admin${p}` (browser URL stays `/clinicians`). Landing routes are not under `/admin`, so the landing can never render there. In proxy before rewriting: `/robots.txt` → `Disallow: /`; `/sitemap.xml` → 404; add `X-Robots-Tag: noindex, nofollow`; no-store on HTML; a literal `/admin/*` request → 404.
- **Public host:** any request under `/admin` or `/api/admin` → 404; everything else untouched.
- **Optimistic gate:** on admin host, paths outside the auth allowlist (`/login`, `/forgot-password`, `/reset-password`, `/complete-account-setup`, `/api/auth/*`, `/_next/*`, static) require the session cookie, else 307 → `/login?next=…`. **Presence only** — proxy is not an authorization layer. Authenticated user on `/login` → `/`.
- `matcher` excludes `_next/static`, `_next/image`, favicon and `public/assets`.

**Local dev:** `http://admin.localhost:3001` (browsers resolve `*.localhost` to loopback, no hosts edit). Plain `localhost:3001` still serves the landing. Add `allowedDevOrigins: ['admin.localhost']`. Cookies are host-only, so sessions never mix. If a tool can't resolve `*.localhost`, add a hosts entry and set `ADMIN_HOSTS`. **Port clash:** backend defaults to :3000 = Next default → run backend with `PORT=4000` (its `.env`, verify) and Next with `-p 3001`; `API_BASE_URL=http://localhost:4000/v1`.

**Production (Vercel project already linked):** add `admin.<domain>` as a second domain on the same project; set `ADMIN_HOSTS` / `NEXT_PUBLIC_ADMIN_URL`.

## 4. Routing (as seen on the admin host)

| URL | Purpose |
|---|---|
| `/login`, `/forgot-password`, `/reset-password?token`, `/complete-account-setup?token` | Auth. Backend emails link to `${APP_WEB_URL}/…`; set `APP_WEB_URL` to the admin origin for admin resets |
| `/` | Dashboard |
| `/clinicians`, `/clinicians/new`, `/clinicians/[id]` | Directory, invite, detail |
| `/users` (`?role=&status=`), `/users/[id]` | Directory (Parents = preset filter) |
| `/children`, `/children/[id]` (tabs), `/children/[id]/plans/[planId]` | Children |
| `/plan-templates`, `/plan-templates/new`, `/plan-templates/[id]` | Templates |
| `/system`, `/help`, `/settings`, `/profile` | Operations / support / prefs / account |
| `/api/auth/*`, `/api/backend/[...path]` | BFF handlers |

## 5. Lazy loading / code splitting

Primary boundary = the two route groups. Landing never imports `@/modules/admin/**`; admin never imports landing components — **enforced by ESLint** (`no-restricted-imports`), verified by comparing the landing's client JS against the M0 baseline. Inside admin, only genuinely heavy pieces use `next/dynamic`: command palette, media viewer, plan-template builder, notification drawer, future charts. Mock modules are dynamically imported only when a mock source is active.

## 6. Folder / module structure

```
src/modules/admin/
  app-shell/       AdminShell, Sidebar, Topbar, MobileDrawer, UserMenu, ThemeToggle, PageHeader, MockDataChip
  ui/              primitives (own folder; not the landing ones)
  navigation/      nav-config.ts, breadcrumbs/ (registry + component)
  search/          types, providers/, use-admin-search, CommandPalette (lazy)
  notifications/   types, source seam, NotificationCenter, toast.ts
  auth/            session.ts (server-only), cookies.ts, actions.ts, SessionKeeper, guards
  lib/             api-client.ts, server-api.ts, api-errors.ts, query-client.ts, query-keys.ts, format.ts
  state/           ui-store.ts
  config/          data-source.ts, env.ts
  providers/       Providers.tsx
  features/<x>/    api/ (XApi, live.ts, index.ts) · hooks/ · components/ · types/ · schemas/
                   x = dashboard, clinicians, users, children, plan-templates, system, help, settings, profile
src/mocks/admin/   dashboard, clinicians, users, children, plan-templates, notifications, system, _factory
```

Pages under `src/app/(admin)/admin/(console)/…` are thin: they import a feature `*Page` component and contain no data.

## 7. Design system strategy

Shadcn-style copy-in primitives on Radix (`radix-ui`), `class-variance-authority`, Tailwind v4, `lucide-react`, `cn()`. New libs are admin-tree only: `radix-ui`, `class-variance-authority`, `cmdk`, `sonner`, `zustand`, `@tanstack/react-query`, `react-hook-form` + `@hookform/resolvers` (template builder only), `server-only`. **No TanStack Table in v1** (no server sort / page numbers); a thin `DataTable` with a column-def interface.

Primitives (built only when first needed): Button, Input, Textarea, Field, Select, Checkbox, Switch, Dialog, ConfirmDialog, Drawer/Sheet, DropdownMenu, Tooltip, Tabs, Badge, **StatusBadge** (enum → tone, one place), Card, Skeleton, DataTable (+ load-more footer in place of Pagination), EmptyState, LoadingState, ErrorState, PageHeader, Breadcrumbs, Avatar, Separator, Kbd.

## 8. Theme / dark mode (designed first)

- Tokens defined **once** in `src/modules/admin/styles/admin.css`, imported only by the admin root layout: `:root{…}` and `.dark{…}` variables exposed via `@theme inline`, so utilities are semantic (`bg-background`, `text-muted-foreground`, `bg-sidebar`…). Dark variant: `@custom-variant dark (&:where(.dark, .dark *));`.
- Tokens: `background, foreground, card, popover, muted, accent, border, input, ring, primary, secondary, destructive, success, warning, info` (each with `-foreground` where relevant), `sidebar, sidebar-foreground, sidebar-accent, sidebar-accent-foreground, sidebar-border, sidebar-ring`, `radius`, `chart-1..5` (reserved). Neutral OKLCH greys; primary near-black (light) / near-white (dark). **No hex in components.**
- Modes `light | dark | system`: small hand-rolled `ThemeProvider` + pre-paint inline script (same technique as the splash script) writing `.dark` and `color-scheme`; preference in `localStorage` (`nn-admin-theme`). Not in Zustand.
- A unit test checks WCAG contrast for key fg/bg pairs in both themes.
- Fonts: Inter only in admin. Lora / Caveat stay in `(public)`.

## 9. Admin shell

`(console)/layout.tsx` (Server Component): `await requireAdmin()` → `<AdminShell session>`.

- **Sidebar:** brand + "Admin"; grouped nav from `nav-config`; one submenu level (auto-open on active child); active state via `usePathname`; icon-only collapsed mode with tooltips; badge slot (pending applications from `/admin/summary`); arrow-key navigation. ≥1024 expanded/collapsible · 768–1023 collapsed rail · <768 off-canvas drawer.
- **Topbar:** sidebar toggle · breadcrumbs · search trigger (⌘/Ctrl+K) · bell (unread dot) · theme control · user menu (name, email, role, Profile, Settings, Sign out). Compact on mobile.
- **Content:** `PageHeader title description actions`; consistent spacing; every data view composes `Loading | Empty | Error | data`.
- `MockDataChip` whenever any mock source is active.

## 10. Sidebar IA and classification

Legend — **Backend:** ✅ exists · ⚠ partial · ❌ none. **Class:** **NOW** = MUST BUILD NOW (mock-first against the real contract, wired live in its milestone) · **AFTER** = BUILD AFTER BACKEND INTEGRATION (blocked on a missing endpoint; ships reduced) · **FUTURE** = UI PLACEHOLDER (labelled "Frontend placeholder / backend integration pending").

| Item | Route | Backend | Class | Notes |
|---|---|---|---|---|
| **Dashboard** | `/` | ✅ summary | NOW | 6 live counts |
| ↳ recent activity | — | ❌ | FUTURE | no audit / activity endpoint |
| ↳ system status card | — | ✅ `/health` | NOW | |
| ↳ quick actions | — | n/a | NOW | links only |
| **Clinicians ▸ Invite** | `/clinicians/new` | ✅ (Phase 10, unreleased) | NOW | admin creates the clinician; setup email sent |
| **Clinicians ▸ All clinicians** | `/clinicians` | ⚠ list only | NOW | client-side filter on loaded rows |
| ↳ clinician detail | `/clinicians/[id]` | ⚠ via `GET /users/{id}` | NOW | composite |
| ↳ suspend / reactivate | | ✅ | NOW | |
| ↳ resend setup link (INVITED) | | ❌ | FUTURE | |
| **Users** (role tabs) | `/users` | ✅ role + status filters | NOW | Parents = tab, not a page |
| ↳ user detail | `/users/[id]` | ✅ | NOW | own row disabled (`CANNOT_SUSPEND_SELF`) |
| ↳ server-side name / email search | | ❌ | AFTER | interim: client-side |
| **Children** list / detail | `/children` | ⚠ no parent name | NOW | parent via cached lookups |
| ↳ care team | tab | ✅ | NOW | picker limited to ACTIVE clinicians (UI guard; backend doesn't check) |
| ↳ plans (read, history) | tab | ✅ | NOW | |
| ↳ admin plan assign / complete / archive | | ✅ | AFTER (post-v1) | outside requested scope |
| ↳ media | tab | ✅ | NOW | `playbackUrl` is no-store; lazy viewer |
| ↳ call history | tab | ✅ | NOW | read-only |
| ↳ "children without clinician" filter | | ❌ | AFTER | only the dashboard count exists |
| **Plan templates** | `/plan-templates` | ⚠ no status filter | NOW | list, create, detail, publish, archive |
| ↳ edit / delete / duplicate | | ❌ | AFTER | |
| **System** | `/system` | ⚠ `/health` only | NOW (health) / FUTURE (AI observability) | |
| **Help** | `/help` | n/a | FUTURE | static placeholders |
| **Settings** | `/settings` | ❌ | NOW (appearance) / FUTURE (config) | client-only |
| **Profile** (user menu) | `/profile` | ✅ `/users/me`, change-password | NOW | change password forces re-login; name / email edit FUTURE |
| **Notifications** (bell) | drawer | ❌ | FUTURE | mock source behind an interface |
| **Global search** | ⌘K | n/a | NOW (nav + actions) / AFTER (entity search) | no backend search |

## 11. Breadcrumbs

One route registry (`navigation/breadcrumbs/registry.ts`): pattern → `{ label | useLabel(params), parent }`. `<Breadcrumbs>` matches the pathname and renders static labels directly. Dynamic labels come from a small `<DynamicCrumb>` that calls the **same TanStack Query hook the page uses** (e.g. `useChildQuery(id)`): shared cache, no extra store or request, skeleton while loading, short-id fallback. Pages never declare their own breadcrumbs. Mobile collapses to parent › current. `<nav aria-label="Breadcrumb">`, `aria-current="page"`.

## 12. Global search

`SearchProvider { id; group; search(query, {signal}) → SearchResult[] }`; `SearchResult { id; title; subtitle?; icon; href | onSelect; keywords[] }`. `useAdminSearch(query)` fans out to providers and groups results; the cmdk UI only knows this interface. v1 providers: **navigation** (derived from `nav-config`) and **actions**. Later: an entity provider over a backend search endpoint (pending). ⌘/Ctrl+K and `/` open it; lazy-loaded; open state in the UI store.

## 13. Notifications / toasts

- **Toasts:** `sonner` behind `toast.ts` (`success/error/warning/info/promise`), themed by tokens; mutations toast from hooks using an `ApiError` → message map.
- **Notification center:** `NotificationSource` (`list`, `markRead`, `markAllRead`), bell with unread dot + drawer (grouped, unread state, empty state). Initial source = **mock**, labelled "Sample data" inside the drawer. Swap to an API when one exists. Never presented as real.

## 14. State management

| Kind | Tool | Examples |
|---|---|---|
| Server state | **TanStack Query** | every backend read / mutation, `/users/me`, summary, health |
| Client / global UI | **Zustand** (one small store) | `sidebarCollapsed` (persisted), `mobileNavOpen`, `commandOpen`, `notificationsOpen` |
| Scoped cross-cutting | **React Context** | session snapshot, theme |
| Local | `useState` / RHF | form fields, dialog open, client-side filter text |

Nothing fetched is copied into Zustand; no giant store.

## 15. TanStack Query

- One `QueryClient` per browser session. Defaults: `staleTime 30 s`, `gcTime 5 min`, refetch on focus, retry 1, **never retry 4xx**. Session error codes trigger the session flow (§16); other 4xx surface in the component.
- **Key factories** per feature (`clinicianKeys`, `userKeys`, `childKeys` incl. `careTeam / plans / media / calls`, `planTemplateKeys`, `adminKeys.summary`, `systemKeys.health`, `sessionKeys.me`).
- Lists use `useInfiniteQuery` with `getNextPageParam: p => p.nextCursor ?? undefined` via a shared `useCursorList` → "Load more".
- Hooks are created only when their milestone needs them: `useAdminSummaryQuery`, `useApplicationsQuery`, `useCliniciansQuery`, `useUsersQuery`, `useChildrenQuery`, `useCareTeamQuery`, `useChildPlansQuery`, `useChildMediaQuery`, `useChildCallsQuery`, `usePlanTemplatesQuery`, `useHealthQuery`, `useMeQuery`; mutations `useApproveApplicationMutation`, `useRejectApplicationMutation`, `useSuspendUserMutation`, `useReactivateUserMutation`, `useAssignClinicianMutation`, `useRevokeClinicianMutation`, `useCreatePlanTemplateMutation`, `usePublishPlanTemplateMutation`, `useArchivePlanTemplateMutation`, `useChangePasswordMutation`.
- **Invalidation:** approve / reject → applications + detail + summary (+ clinicians on approve); suspend / reactivate → user detail + users + clinicians + summary; assign / revoke → care team + clinician / user detail + summary; template create / publish / archive → templates + detail. No optimistic updates except idempotent status toggles.
- **Entity directory hook** (`useUserNames(ids)` / `useClinicianDirectory()`): resolves id → name from cached `/users/{id}` or one `/clinicians` + `/users?role=PARENT` fetch with long `staleTime`. A frontend workaround for a backend gap.

## 16. Authentication / session (BFF; no backend changes)

**Flow:** `/login` → Server Action → `POST /v1/auth/login` → `GET /v1/users/me` with the new token → require `role === 'ADMIN'` and `status === 'ACTIVE'`; otherwise `POST /auth/logout` (revoke the just-issued refresh token) and return a form error → else set cookies and redirect to a validated same-origin `next`.

**Tokens:** only in httpOnly cookies on the admin host — `__Host-nn_at` (access, `Max-Age = expiresIn`), `__Host-nn_rt` (refresh, 30 d); `Secure`, `SameSite=Lax`, `Path=/`, **no Domain**. Dev uses non-`__Host-` names. Browser JS never sees a token.

**Server access (`auth/session.ts`, `server-only`, `React.cache`):** `getSession()` reads the cookie → `GET /users/me`; `requireAdmin()` redirects to `/login` or renders an Unauthorized screen for a non-admin (cookies cleared). This is the **real** gate; the backend re-enforces ADMIN on every call.

**Client data path:** hooks call same-origin `/api/backend/[...path]`, which attaches the bearer from the cookie, forwards only an **allowlist** of method + path patterns, and returns problem+json unchanged. CSRF: `SameSite=Lax` + a required non-simple header (`X-NN-Admin: 1`) + `Origin` check on mutating methods.

**Refresh (the dangerous part):** the backend rotates refresh tokens and revokes the family on reuse, with a 5/min throttle.
- Refresh is centralised in **one** handler `POST /api/auth/refresh`, single-flighted per refresh token in-process, memoising `oldRT → newTokens` for ~10 s.
- Proxy **never** refreshes. The client `SessionKeeper` refreshes proactively at ~80 % of `expiresIn`, guarded by `navigator.locks` across tabs.
- A navigation with an expired access cookie but a refresh cookie is redirected to `/api/auth/refresh?next=…` (GET variant; ignores prefetch requests).
- Residual risk: on multi-instance serverless the memo isn't shared, so a rare concurrent refresh could revoke the family and force a re-login. Acceptable for an admin tool; the clean fix is a short grace window on the backend (out of scope).

**Cases:** unauthenticated → `/login?next`; non-admin → "no admin access" + sign-out; expired (refresh 401 `INVALID_REFRESH_TOKEN`) → clear cookies, `/login?reason=expired`; suspended (403 `ACCOUNT_NOT_ACTIVE`) → forced logout; **`INVALID_CREDENTIALS` is a form error, not session expiry** (decide by error code, not status); 429 → "too many attempts"; init → shell skeleton; logout → `POST /auth/logout`, clear cookies; change-password → backend revokes all sessions → clear cookies, redirect to login.

## 17. Authorization

Defence in depth: (1) proxy optimistic redirect, (2) `requireAdmin()` in the console layout and in route-handler / Server Action entry points, (3) backend `PermissionsGuard` on every call (ground truth), (4) BFF allowlist. A small `can(permission)` helper hides buttons only (cosmetic). Non-admin roles are rejected at entry. `403 INSUFFICIENT_PERMISSIONS` renders in `ErrorState`.

## 18. Mock / static data

- **Seam:** each feature defines `interface XApi` (real backend shapes incl. the cursor envelope, enums, ISO strings). `api/live.ts` implements it with `apiClient`; `src/mocks/admin/<x>.ts` implements the same interface over an in-memory store (mutations really mutate), with `_factory.ts` providing cursor pagination, latency and error injection. `features/<x>/api/index.ts` picks live or mock from `config/data-source.ts` (`NEXT_PUBLIC_ADMIN_DATA_SOURCE=mock|live`, per-feature `ADMIN_MOCK_FEATURES=children,users`) via **dynamic import**, so mocks never enter live bundles. Production builds refuse mock sources unless `ALLOW_ADMIN_MOCKS=1`. Components and hooks never hold data arrays.

| Static content | Status | Replaced by |
|---|---|---|
| Dashboard numbers, table rows, clinician / user / child / template samples | TEMPORARY (`mocks/admin/*`) | live API via `live.ts` |
| Notifications | TEMPORARY | backend notifications API (none yet) |
| System health samples | TEMPORARY | `/health` (live from M4) |
| Nav definitions, breadcrumb registry, search actions | PERMANENT config (`modules/admin/navigation`); only each item's `status` flag is temporary | flag flipped as features land |
| Help text, placeholder descriptions, empty-state copy | PERMANENT content files (`features/*/content`), placeholders marked | real docs later |
| Settings options | PERMANENT config | — |

Admin UI labels may live in components (the "no copy in JSX" rule is for marketing copy); lists, rows and sample entities may not.

## 19. API integration boundaries

`apiClient` (browser → BFF) and `serverApi` (server → backend) are the only places that know URLs, headers, token handling and problem+json parsing → typed `ApiError { status, code, title, detail, errors?, requestId }`. Feature `live.ts` files map DTO → view-model and validate critical responses with zod. Env validated once in `config/env.ts`: `API_BASE_URL` (server), `NEXT_PUBLIC_ADMIN_URL`, `ADMIN_HOSTS`, `NEXT_PUBLIC_ADMIN_DATA_SOURCE`, `ADMIN_MOCK_FEATURES`, `ALLOW_ADMIN_MOCKS`.

**Backend gaps to raise later (not built here):** CORS (avoided by BFF), parent name on children, search / sort / status filters, `GET /clinicians/{id}`, resend setup link, notifications, refresh grace window, activity feed.

## 20–25. Feature plans (each screen covers Loading · Empty · Error · Success)

- **Dashboard (NOW):** 6 summary cards (invited clinicians → directory filtered to INVITED, active clinicians, active parents, active plans, children with / without clinician → deep links), system status card (`/health`), quick actions, activity-feed placeholder. Skeleton cards; "Unable to load dashboard" with retry; zero renders as 0.
- **Clinicians (NOW):** directory (status filter, quick search) + detail; Invite clinician form; Resend invitation (INVITED only); Deactivate / Activate via suspend / reactivate; inline handling of `EMAIL_ALREADY_REGISTERED` / `CLINICIAN_EMAIL_LOCKED` / `CLINICIAN_NOT_INVITED`. Clinician list (client filter), detail via `/users/{id}` + assigned children, Suspend / Reactivate, INVITED state explained. Empty: "No pending clinician applications." / "No clinicians found."
- **Users (NOW):** directory with role tabs + status filter (server), load more, detail (identity, status, child link / assigned children), Suspend / Reactivate with confirm (409s mapped; own account disabled).
- **Children (NOW):** list (name, age, parent via directory hook, created); detail header + tabs — Overview, Care team (assign dialog with ACTIVE-clinician picker, revoke confirm, `CLINICIAN_ALREADY_ASSIGNED`; empty "No clinician assigned"), Plans (history + status filter → plan detail + notes), Media (grid; null `playbackUrl` states; lazy viewer), Call history.
- **Plan templates (NOW):** list (status badge, days count), detail (days), create (RHF + zod mirroring backend: title ≤ 200, description ≤ 2000, ≥ 1 day, contiguous `dayNumber` 1..N managed by the reorder UI), Publish (explicit "cannot be undone"), Archive (terminal). No edit — UI says drafts can't be edited yet.
- **System / Help / Settings / Profile:** System health (status, DB, uptime, last checked, auto-refresh; 503 = degraded / down, not error); AI observability placeholder. Help placeholders. Settings = Appearance now, rest future. Profile = identity from `/users/me` + last login; change password (current / new 10–128, confirm; success → re-login); name / email edit future.

## 26. Responsive

Desktop ≥1024: sidebar + topbar. Tablet 768–1023: collapsed icon rail with tooltips. Mobile <768: off-canvas drawer, compact topbar. **Tables:** `DataTable` renders a table ≥ `md`; below, each row becomes a stacked card (primary field as title, 2–3 key fields, status badge, row action menu) via a per-table `mobileCard` slot. No page-level horizontal overflow (inner scroll only for wide secondary tables). Dialogs become bottom sheets on mobile.

## 27. Accessibility

Semantic `nav / main / header`; skip-link to `#main`; one `<h1>` per page; visible focus ring from `--ring` (admin.css supplies its own); Radix focus trap / restore for Dialog, Drawer, Dropdown; arrow-key navigation in sidebar and menus; `aria-current` for active nav / breadcrumb; `aria-live` for toasts and async table updates; labelled icon-only buttons; combobox semantics in the palette; `aria-invalid` / `aria-describedby` on form errors; `prefers-reduced-motion`; contrast tests (§8); table headers with `scope` and captions; status never conveyed by colour alone.

## 28. Testing

Adds **Vitest + @testing-library/react + jest-dom (jsdom)** and **Playwright**. Quality gate becomes typecheck → lint → test → build.

- **Unit:** `isAdminHost` and proxy decisions (host × path × cookie matrix, `/admin/*` leakage, robots / sitemap, prefetch), cursor helper, `ApiError` parsing and session-code mapping, breadcrumb resolution, search providers, token contrast, env schema, template-days schema.
- **Component:** DataTable states (loading / empty / error / mobile card), StatusBadge mapping, ConfirmDialog a11y, Sidebar active / collapse, Login form states.
- **Hook / integration:** query hooks and mutations against the **mock** `XApi` (validates the seam), invalidation behaviour.
- **Route handlers:** `/api/auth/refresh` single-flight + memo (concurrent calls → 1 backend call); `/api/backend` allowlist / CSRF.
- **E2E (Playwright, `baseURL=http://admin.localhost:3001`):** login redirect, non-admin rejected, login → dashboard, approve application, suspend user, theme persistence / no flash, public-host `/admin` → 404, landing `/` unaffected, mobile drawer; axe on key pages; smoke suite against the local backend.
- **Bundle guard:** compare `/` client JS against the stored M0 baseline.
- **Scope discipline:** keep test infrastructure lean. Add Playwright and RTL only when a milestone needs them.

## 29. Environment / local domain

See §3 and §19. Also: `.env.local` additions (names only), `next dev -p 3001`, backend `PORT=4000`, `allowedDevOrigins`. Runbook goes in `docs/admin.md` (M11).

## 30. Implementation order

Dependency-ordered milestones M0 → M11 as in the checklist above. Each ends green on typecheck + lint + tests + `next build`. Mock data is used from M4 only until each feature's `live.ts` is wired in its own milestone (M6–M9); the backend is already complete, so most milestones can go live immediately and keep the mock source for tests and demos.

## Critical files

- **Move (no content edits):** `src/app/{page,faq,for-parents,for-clinicians,how-it-works,privacy,not-found,error}*` → `src/app/(public)/…`
- **Modify:** `src/app/layout.tsx` → `src/app/(public)/layout.tsx`; `next.config.ts`; `src/app/robots.ts`, `sitemap.ts`; `package.json`; `eslint.config.mjs`; `.env.example`; `AGENTS.md` routing table
- **Create:** `src/proxy.ts`, `src/app/(admin)/**`, `src/modules/admin/**`, `src/mocks/admin/**`, `docs/admin.md`, test config
- **Reuse as-is:** `src/lib/utils.ts` (`cn`), `lucide-react`, `zod` and the `FormState` convention for auth forms
- **Do not touch:** `src/components/layout/splash-screen.tsx` (uncommitted user work) until the user says otherwise

## Verification (per milestone and at the end)

1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` — route table shows `(public)` and `(admin)` routes; `/` client JS matches the pre-M0 baseline.
2. `npm run dev -- -p 3001`: `http://localhost:3001` landing renders exactly as before; `/admin` → 404.
3. `http://admin.localhost:3001`: unauthenticated → `/login`; HTML has no landing CSS / fonts / JSON-LD; `robots.txt` = Disallow; `X-Robots-Tag: noindex`.
4. With the local backend (seeded admin): login works; parent / clinician credentials → "no admin access" and the refresh token is revoked; suspending a throwaway session forces logout on the next request; deleting the refresh cookie → `/login?reason=expired`; parallel requests across expiry → no unexpected logout.
5. Theme: toggle light / dark / system, hard reload → no flash; contrast test green.
6. Feature walkthroughs in mock and live: approve / reject application, suspend / reactivate user, assign / revoke clinician, create → publish → archive template, change password → re-login.
7. Playwright suite + axe; resize 1280 / 820 / 390 and check sidebar modes and table card layout.
