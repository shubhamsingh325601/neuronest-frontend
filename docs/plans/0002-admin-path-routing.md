# Plan 0002 — Admin at `/admin` on the same origin (milestone M4.5 of plan 0001)

> **Status: APPROVED by the owner and IMPLEMENTED (2026-10-05).** Deviations from the text below are listed in "Implementation notes" at the end. Original wording: Implements the decision of 2026-10-05 in [0001-admin-app.md](0001-admin-app.md) ("Admin is served at `/admin`, not on an `admin.` subdomain") and answers its seven M4.5 open questions. Do this before M5. Nothing changes behaviour except URLs, cookies and the proxy.

## 1. Summary

The Admin app already lives in `src/app/(admin)/admin/…`, so its real URLs are already `/admin/…`. Today `src/proxy.ts` hides that prefix with a host-based rewrite, and every admin path in code is written without it. M4.5 deletes the host model and makes **the address-bar path and the code path the same thing**.

- Admin URLs: `/admin`, `/admin/login`, `/admin/users`, `/admin/api/backend/*`, `/admin/api/auth/*`.
- The proxy only acts on `/admin/*`. Every other request passes through untouched, so the landing site (HTML, headers, client JS) cannot change.
- Session cookies move to `__Secure-` names with `Path=/admin` (Q1), so no admin token is ever attached to a landing request.
- Backend: **no code change**. Only the `APP_WEB_URL` env value changes (Q6).

Guardrails from plan 0001 hold: no new auth provider, no microfrontends, no new libraries.

## 2. Answers to the seven open questions

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | Cookies | Yes. Production: `__Secure-nn_at` / `__Secure-nn_rt`, `Path=/admin`, `Secure`, `HttpOnly`, `SameSite=Lax`, no `Domain`. Development (plain http): `nn_at` / `nn_rt`, `Path=/admin`, not Secure. Details in §5. |
| 2 | Route layout | Keep `src/app/(admin)/admin/…` exactly as is. Delete the rewrite. No file moves, so git history and the ESLint globs stay valid. |
| 3 | Catch-all / not-found shadowing | Not an issue, with one rule to test. In the App Router a static `admin` segment outranks `(public)/[...slug]`, so `/admin/*` never reaches the landing catch-all or landing `not-found`. An unknown `/admin/xyz` is handled by `(console)/[...slug]` and renders the console 404 inside the shell (status 200, as today); anonymous visitors are redirected to login by the gate first, so unknown admin URLs reveal nothing. `/adminx` and `/ADMIN` are not admin routes: they render the landing 404 and get no admin headers. |
| 4 | Robots / noindex | Proxy adds `X-Robots-Tag: noindex, nofollow` on every `/admin/*` response; `robots.ts` adds `disallow: "/admin"`; `sitemap.ts` is unchanged (it lists six public URLs, never admin) and a test pins that. The landing site must never link to `/admin` (grep confirms none today). JSON-LD only describes the Organisation. |
| 5 | Auth pages / loop guard | Unchanged in behaviour. `/admin/login` etc. stay in the `(auth)` group outside the shell. The gate still passes the public pages, still bounces a signed-in user off `/admin/login` to a validated `next`, and still never bounces `/admin/login?reason=…`. Tests are ported, not dropped. |
| 6 | Email links | Backend config only. `buildWebLink(appWebUrl, path, token)` is plain concatenation (`common/email/web-link.util.ts`) and is used only for `/reset-password` and `/complete-account-setup`. Set backend `APP_WEB_URL=https://<site>/admin` (dev: `http://localhost:3001/admin`) and the links become `…/admin/reset-password?token=…`. `CORS_ORIGINS` is independent and unaffected. **Ask the backend owner to confirm** the value and that no other flow (for example a future parent web app) needs `APP_WEB_URL` at the site root. |
| 7 | Same-origin security | See §8. Short version: same-origin XSS on a landing page could call the BFF, and nothing on a shared origin fully prevents that; the landing site has no user-generated HTML and no third-party scripts, which is the real mitigation. Add admin-only headers (frame-ancestors, no-store, nosniff, referrer policy). The BFF keeps its allowlist, `X-NN-Admin` header, and Origin check; nothing is weakened. A script-src CSP with nonces is **not** proposed now (cost and risk, see §8). |

## 3. Target URL map

| URL | Purpose | Gate |
| --- | --- | --- |
| `/admin` | Dashboard | session cookie present, then `requireAdmin()` |
| `/admin/clinicians`, `/users`, `/children`, `/plan-templates`, `/system`, `/help`, `/settings`, `/profile` (+ future `[id]` pages) | Console | same |
| `/admin/login`, `/forgot-password`, `/reset-password`, `/complete-account-setup`, `/session-error` | Auth pages | public; `/admin/login` bounces signed-in users |
| `/admin/api/backend/[...path]` | BFF to `API_BASE_URL/v1/*` | cookie present (else 401 problem+json); allowlist + CSRF in handler |
| `/admin/api/auth/refresh` (GET, POST), `/admin/api/auth/session-ended` (GET) | Cookie-changing auth handlers | pass through the proxy; checks inside the handler |
| `/robots.txt` | Public robots, now with `Disallow: /admin` | n/a |

Not admin and untouched: `/`, `/faq`, `/for-parents`, `/for-clinicians`, `/how-it-works`, `/privacy`, `/sitemap.xml`, `/robots.txt`, the public 404, `/_next/*`, `/assets/*`.

## 4. Path model (the one design choice that touches many files)

**All admin paths in code are the full browser path, built from one module.** `src/modules/admin/navigation/paths.ts` (already pure, importable from the proxy) gains:

```ts
export const ADMIN_BASE = "/admin";
export const adminPath = (sub = "/") => (sub === "/" ? ADMIN_BASE : `${ADMIN_BASE}${sub}`);
export const ADMIN_ROUTES = {
  login: "/admin/login", forgotPassword: "/admin/forgot-password", resetPassword: "/admin/reset-password",
  completeAccountSetup: "/admin/complete-account-setup", sessionError: "/admin/session-error",
  authRefresh: "/admin/api/auth/refresh", sessionEnded: "/admin/api/auth/session-ended",
  backendBase: "/admin/api/backend",
} as const;
```

`normalizeAdminPath` is deleted: there is no rewrite, so `usePathname()` returns the real `/admin/…` path. `nav-config` hrefs become `adminPath("/users")` etc., breadcrumb patterns become full paths, `isPathActive` compares full paths (dashboard `/admin` stays exact-match).

Why not keep unprefixed paths and prefix at render time: every Link, redirect and fetch would need a wrapper, and forgetting one sends the user to the landing 404 silently. With full paths, what is in the address bar is what is in the code, and a guard test (§9) catches a literal that forgets the prefix.

## 5. Cookies on a shared origin

- Names (`auth/cookie-names.ts`): production `__Secure-nn_at`, `__Secure-nn_rt`; development `nn_at`, `nn_rt`. Same helper signature.
- Attributes (`auth/cookies.ts`, `baseOptions`): `httpOnly`, `secure` in production, `sameSite: "lax"`, `path: ADMIN_BASE`, never `domain`. `clearSessionCookies` already reuses `baseOptions`, so clearing uses the same Path (a different Path would leave the cookie behind).
- Why `Path=/admin` and not `/admin/api`: page navigations (`requireAdmin()`, the proxy gate) need the cookie too. The BFF, refresh and session-ended handlers all live under `/admin/api/…`, so they receive it.
- Why not `__Host-`: it requires `Path=/`, which would send the tokens on every landing request (CDN logs, any future landing route handler). `__Secure-` keeps the "must be set over https" guarantee without the Path restriction.
- Path matching is on a `/` boundary, so `/adminx` and `/administrator` do not receive the cookie. A test pins the attributes; the live check confirms it in devtools.
- Honest limit: `Path` is not a security boundary against same-origin script (§8). Its value is leakage control, not XSS defence. `__Secure-` also does not stop same-origin script from setting a cookie of that name (session fixation); a script that can do that can already call the BFF.
- Rejected: `SameSite=Strict` (breaks opening an admin link from chat or email while signed in, because the first cross-site navigation arrives without the cookie).
- No migration: the old host-only cookies were on `admin.*` hosts that never existed in production, and development cookies were on `admin.localhost`.

## 6. Proxy rules (`src/proxy.ts`)

Keep the file and the broad exclusion matcher (`_next/static`, `_next/image`, favicon, `assets/`), then **return `NextResponse.next()` immediately for anything outside `/admin`**. Reason for keeping the broad matcher rather than a narrow `/admin/:path*` one: the early return keeps landing responses byte-identical, and the existing normalisation (decode, collapse `//`, lower-case, for matching only) still catches `/%61dmin` and `//admin`, whose handling by the matcher I cannot confirm from the docs and will test live (§11). Narrowing is an optional later tidy-up.

For a path under `/admin` (matching case-insensitively, fail-safe):

| Request | Result |
| --- | --- |
| `/admin/api/auth/*` | pass (handlers self-authenticate) |
| `/admin/login`, `/forgot-password`, `/reset-password`, `/complete-account-setup`, `/session-error` | pass; `/admin/login` with a session cookie and no `?reason=` redirects to `safeNextPath(next)` |
| anything else, no session cookie, `/admin/api/*` | 401 `application/problem+json` (`MISSING_TOKEN`) |
| anything else, no session cookie, page | 307 to `/admin/login?next=<encoded path+query>` (bare `/admin/login` when `next` is the dashboard) |
| anything else, session cookie present | `NextResponse.next` with request header `x-nn-path` = browser path + query (always overwritten; kept because Server Components cannot read the request path, and `requireAdmin()` builds `next` from it) |

Headers added to every `/admin/*` response, including redirects and the 401:

- `X-Robots-Tag: noindex, nofollow`
- `Cache-Control: no-store`. Plan 0001 §3 called for it but the current proxy does not set it, so this is a small addition, not a regression; it is cheap and stops a CDN or browser caching signed-in HTML.
- `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin` (reset and setup links carry a token in the query string)

Removed: `decideRoute`, `isAdminHost`, `parseAdminHosts`, the rewrite, the `/__not-found` rewrite, the host `robots` and `notFound` actions, and "public host `/admin` is 404". `robots.txt` is now only `src/app/robots.ts`.

## 7. Inventory: what changes, file by file

**Delete**
- `src/lib/host.ts`, `src/lib/host.test.ts`: whole host model.

**Rewrite**
- `src/proxy.ts`: §6. Imports `ADMIN_BASE`, `cookieNames`, `decideGate`, `NEXT_PATH_HEADER`; no `@/lib/host`.
- `src/modules/admin/auth/gate.ts`: `PUBLIC_PAGES` and the `/api` prefixes use full `/admin/...` paths (from `ADMIN_ROUTES`); redirect targets `/admin/login`; the `next` logic is otherwise unchanged. Paths outside `/admin` are not its business (the proxy returns before calling it).
- `src/modules/admin/auth/safe-next.ts`: **semantics invert**. A valid `next` must now *be inside* admin: starts with `/admin` (exactly `/admin` or `/admin/…`), same existing rules (length, no `//`, no control chars or backslash, decode check), and must not be an auth page or `/admin/api/*`. Fallback is `/admin`. The old `BLOCKED` entry `"/admin"` goes away (it blocked the internal prefix).
- `src/modules/admin/navigation/paths.ts`: §4. Remove `normalizeAdminPath`; `isPathActive` on full paths.

**Update (literals and builders)**
- `auth/cookie-names.ts`, `auth/cookies.ts`: §5.
- `auth/session.ts`: `requireAdmin()` redirects use `ADMIN_ROUTES` (`login?reason=expired[&next=]`, `authRefresh?next=`, `sessionEnded?reason=`); `requestedPath()` falls back to `/admin`.
- `auth/session-routes.ts`: every `redirectTo("/login…")` and `/session-error?…` becomes the `/admin/...` route; `refreshFailureLocation` likewise. Logic (CSRF, prefetch, cross-site checks) unchanged.
- `auth/actions.ts`: `logoutAction` redirects to `/admin/login?reason=signed-out`; `loginAction` keeps `safeNextPath(...)`. `auth/recovery-actions.ts`: check for any redirect literal (none expected).
- `auth/browser-refresh.ts`: fetch `ADMIN_ROUTES.authRefresh`; redirects `/admin/login?reason=…`. Stale comment ("per IP") can be fixed in passing.
- `lib/api-client.ts`: BFF base `ADMIN_ROUTES.backendBase`; `navigate("/admin/login?reason=suspended")`. `lib/http.test.ts` expectations follow.
- `auth/session-error-view.tsx`: the two anchors use `authRefresh` / `sessionEnded`.
- Link literals: `app-shell/user-menu.tsx` (`/profile`, `/settings`), `auth/forgot-password-form.tsx`, `auth/login-form.tsx`, `auth/set-password-form.tsx`, `auth/link-problem.tsx` (via the `actionHref` passed from `(auth)/reset-password` and `complete-account-setup` pages), `features/dashboard/components/quick-actions.tsx`, `summary-cards.tsx`, `features/system/components/system-status-card.tsx`, `(console)/not-found.tsx` (`Back to dashboard`), `navigation/nav-config.ts`, `navigation/breadcrumbs/registry.ts` (+ `breadcrumbs.tsx` consumes full hrefs), `app-shell/sidebar-nav.tsx` (reads `item.href`/`item.prefix`; verify `prefix` too), `navigation/use-admin-pathname.ts` (becomes a plain `usePathname()` wrapper, or is removed if nothing else needs it).
- `(admin)/layout.tsx`, `(console)/layout.tsx`: comments only (the "rewrite" explanation); `force-dynamic` stays (the layout reads cookies).

**Public side (small, no component change)**
- `src/app/robots.ts`: `rules: { userAgent: "*", allow: "/", disallow: "/admin" }`. It may not import from `@/modules/admin` (ESLint boundary), so it uses the literal, and a test in `modules/admin/navigation/paths.test.ts` asserts it equals `ADMIN_BASE` (admin code may import `@/app/robots`; the boundary only forbids `@/app/(public)` and `@/app/actions`).
- `src/app/sitemap.ts`: no change; a test asserts no entry contains `/admin`.
- `(public)/[...slug]`, `(public)/not-found.tsx`: **no change** (see Q3).

**Config and env**
- `next.config.ts`: remove `allowedDevOrigins: ["admin.localhost"]`.
- `.env.example`: remove `ADMIN_HOSTS` and its comment block. (`NEXT_PUBLIC_ADMIN_URL` was never added, so nothing to remove there; docs mention it as "to come".)
- `package.json`: scripts unchanged (`next dev -p 3001`).
- `eslint.config.mjs`: **no change needed.** Its globs (`src/app/(admin)/**`, `src/modules/admin/**`, `src/mocks/**`) and the public globs do not reference the host model. The proxy and `src/lib/host.ts` were never inside either boundary. Verify by running lint.
- `src/modules/admin/styles/admin.css` and `src/app/(public)/globals.css` `@source` lists: **no change** (no folders added or moved). Verify the landing CSS is byte-identical in the build.
- `src/modules/admin/config/env.ts`: check it has no reference to `ADMIN_HOSTS` (grep found none outside the proxy and docs).

**Tests**
- Rewrite: `src/proxy.test.ts`, `src/proxy.gate.test.ts`, `auth/gate.test.ts`, `auth/helpers.test.ts` (safe-next, cookies), `auth/session-routes.test.ts`, `bff/handler.test.ts`, `navigation/nav.test.ts`, `lib/http.test.ts` (URLs), plus `auth/actions.test.ts` if it asserts redirect targets.
- The `ORIGIN`/`host` fixtures in `session-routes.test.ts` and `handler.test.ts` change from `admin.localhost:3001` to `localhost:3001`; the CSRF tests themselves (missing header, wrong Origin, missing Origin) stay and must still pass.

## 8. Risks and how each is tested

| Risk | Why it matters | Mitigation | Test |
| --- | --- | --- | --- |
| **Same-origin XSS reach** | A script injected into a landing page can `fetch("/admin/api/backend/...")` with the `X-NN-Admin` header and the browser attaches the cookie. Path-scoped cookies and the Origin check do not stop this, because the request really is same-origin. | Reduce the chance: the landing site has no user-generated HTML, no third-party scripts, and only static `dangerouslySetInnerHTML` (splash script, JSON-LD). Reduce the blast radius: BFF allowlist (no auth routes, no jobs, no uploads), backend still enforces ADMIN per call, admin-only headers (§6). Keep the rule that the landing site never renders untrusted HTML or loads third-party script. A nonce-based `script-src` CSP for `/admin` is deliberately **not** in scope: the theme and sidebar pre-paint inline scripts would need nonces, and nonces force dynamic rendering of the auth pages. Decide separately if the owner wants it. | Unit: BFF still 403s a missing header, a foreign Origin and a missing Origin; allowlist unchanged. Live: response headers on `/admin/*` (§11). Landing grep for third-party scripts stays clean. |
| **Cookie leakage to landing requests** | With `Path=/` the tokens would ride every landing request. | `Path=/admin`, `__Secure-` (§5). | Unit: attributes (`Path=/admin`, `HttpOnly`, `SameSite=Lax`, `Secure` + prefix in production, no `Domain`), and that clearing uses the same Path. Live: devtools shows the cookies only on `/admin*` requests; a request to `/` and to `/adminx` carries none. |
| **Catch-all / not-found shadowing** | Two root layouts share the `/` namespace; a wrong catch-all could swallow or leak admin URLs, or admin 404s could render landing UI. | Q3 analysis; no change to the catch-alls. | `next build` route table has no conflict. Live: anonymous `/admin/xyz` redirects to login; signed-in `/admin/xyz` shows the console 404 in the shell; `/adminx`, `/ADMIN` and `/faq/x` show the landing 404 with no `X-Robots-Tag`. |
| **Gate bypass through path tricks** | `/%61dmin/users`, `//admin/users`, `/admin/`, `/Admin` | Proxy matches on a normalised path and returns early only for clearly non-admin paths; `requireAdmin()` and the backend remain the real gate. | Unit matrix for each variant (proxy + gate). Live: curl each variant unauthenticated and confirm no admin content and, where the route does resolve, a login redirect. |
| **`next` redirect after login** | Semantics inverted (must now start with `/admin`). A bug could allow an off-site or auth-page target, or loop. | Rewrite `safeNextPath` with the same hostile-input table as today. | Unit: `//evil.com`, `/\evil`, `javascript:`, `/admin/../x`, `%2F%2F`, over-long, `/admin/login`, `/admin/api/...`, `/faq` (rejected), `/admin/users?role=PARENT` (accepted). |
| **A forgotten literal** | A link or redirect without `/admin` silently lands on the landing 404 (for example `/login`). | One path module (§4). | Guard test: scan `src/modules/admin/**` and `src/app/(admin)/**` for `href="/`, `redirect("/`, `location.assign("/`, `fetch("/` literals not starting with `/admin` (allow-list for `#main` and external URLs). Small, one file. |
| **Email links (`APP_WEB_URL`)** | Existing invites or reset emails already sent with `https://<site>/reset-password?...` would hit the landing 404. | Backend env change at deploy time; there are no production admins yet. | Manual: request a reset and an invitation against the dev backend and open the emailed link (§11). |
| **Landing regression** | The proxy now sees every request but must be inert for non-admin paths. | Early return before any header work. | Unit: `/`, `/faq`, `/robots.txt`, `/sitemap.xml` give a bare `next()` with no added headers. Gate: `node scripts/measure-landing-js.mjs --check docs/baselines/landing-js.json`. |
| **Full reload between the two root layouts** | `/` to `/admin` navigates with a full page load (documented Next caveat). | Accepted; the landing never links to admin. | None needed. |

## 9. Implementation steps (each ends with typecheck + lint + test green)

1. **Paths module and guard test.** Add `ADMIN_BASE`, `adminPath`, `ADMIN_ROUTES`, `isAdminPath` to `navigation/paths.ts`, with unit tests. Add the literal-scan guard test (it fails until step 5 is complete; add it last if you prefer a green tree at every commit).
2. **Pure auth logic.** `safe-next.ts` and `gate.ts` on full paths; rewrite their tests (including the path-trick and hostile-`next` tables).
3. **Cookies.** New names and `Path=/admin`; update the cookie tests.
4. **Proxy.** Rewrite `src/proxy.ts` per §6; delete `src/lib/host.ts` and its test; rewrite `proxy.test.ts` and `proxy.gate.test.ts` (landing paths inert, admin matrix, header set, `x-nn-path`).
5. **URL builders.** Server and client redirects (`session.ts`, `session-routes.ts`, `actions.ts`, `browser-refresh.ts`, `api-client.ts`, `session-error-view.tsx`), then every Link/href literal and `nav-config`, breadcrumbs, `isPathActive`. Update `nav.test.ts`, `http.test.ts`, `session-routes.test.ts`, `handler.test.ts` fixtures.
6. **Public side and config.** `robots.ts` + test, sitemap test, remove `allowedDevOrigins` and `ADMIN_HOSTS`, update `.env.example`.
7. **Quality gate.** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; then `node scripts/measure-landing-js.mjs --check docs/baselines/landing-js.json`. Check the `next build` route table (no conflicts; landing routes unchanged).
8. **Live re-verification** (§11) against the dev backend, with the backend owner changing `APP_WEB_URL` first.
9. **Docs** (§12), tick M4.5 boxes, report to the owner. Commit only when asked.

Suggested commit split if the owner wants several: steps 1 to 4 (logic), 5 (URLs), 6 to 9 (public side, verification, docs).

## 10. Test changes at a glance

- Proxy: non-admin paths inert; `/admin` matrix (anonymous page, anonymous API 401, auth pages pass, `/admin/api/auth/*` pass, session-cookie pass with `x-nn-path`, `/admin/login` bounce and `?reason=` guard); header set on pass, redirect and 401; path tricks (`/%61dmin`, `//admin`, `/ADMIN`, trailing slash); `/adminx` is not admin.
- Gate and `safeNextPath`: ported, inverted, hostile inputs.
- Cookies: names by environment, attributes, clear uses same Path, no `Domain`.
- Session routes and BFF: redirect targets, CSRF unchanged.
- Navigation: every nav route has a page and a breadcrumb (existing test), active state on `/admin/...`.
- Public: robots disallows `/admin`, sitemap has none.
- Guard: no prefix-less admin literals.

## 11. Live re-verification list (dev backend, `npm run dev` on 3001)

Never read `.env.local`. Backend `APP_WEB_URL` set to `http://localhost:3001/admin` by its owner.

1. `/` and the other landing pages render as before; response has no `X-Robots-Tag`; `/robots.txt` shows `Disallow: /admin`; `/sitemap.xml` has no admin URL.
2. Anonymous `/admin` and `/admin/users?role=PARENT` redirect to `/admin/login` (with `next` for the second). Anonymous `/admin/api/backend/users` is 401 problem+json.
3. Login as the seeded admin lands on `next` or `/admin`. Devtools: cookies `nn_at` / `nn_rt`, `Path=/admin`, HttpOnly; none sent with a request to `/`.
4. Headers on `/admin` and `/admin/login`: noindex, no-store, frame-ancestors, nosniff, referrer policy.
5. Dashboard (live success or the known live error state) and System page work through `/admin/api/backend/*`.
6. Direct URL entry to `/admin/system` and a hard reload keep the session; unknown `/admin/xyz` shows the console 404 in the shell.
7. Refresh: delete only the access cookie, reload → bounces through `/admin/api/auth/refresh` and returns to the same page; delete the refresh cookie → `/admin/login?reason=expired`; SessionKeeper POST works (watch the network tab); the throttled and backend-down paths land on `/admin/session-error`.
8. Logout returns to `/admin/login?reason=signed-out` and the cookies are gone.
9. A parent or clinician login shows "does not have admin access" and the token is revoked; suspended-account forced sign-out still works.
10. Path tricks against the running server: `/%61dmin`, `//admin/users`, `/ADMIN`, `/admin/`, `/adminx` (landing 404, no cookie sent).
11. A signed-in user opening `/admin/login` bounces to the dashboard; `/admin/login?reason=expired` does not bounce.
12. Forgot-password and invitation emails (backend dev mail or log) contain `/admin/reset-password?token=` / `/admin/complete-account-setup?token=`, and those pages work.
13. `npm run build && npm start` once: same checks 1, 2, 4 on the production build (cookie names switch to `__Secure-` only over https, so the `__Secure-` check happens on the Vercel preview).

## 12. Docs to update in the same change

- `docs/plans/0001-admin-app.md`: Decision section stays; update in place §2 (tree: remove "invisible on the admin host"), §3 (replace host strategy with a pointer to this plan, delete the host rules), §4 (prefix `/admin`), §16 (cookies), §28/§29 (env, local URL), Verification items 2 and 3, M0 and M11 items that mention the admin host; tick the M4.5 boxes; add a link to this plan in the M4.5 section.
- `AGENTS.md`: routing-table row for Admin and the "Decision 2026-10-05" wording (the owner already has uncommitted edits there; merge, do not overwrite).
- `docs/README.md`: row for this plan.
- `docs/architecture.md`: rewrite "Host routing and the Admin app" as "Admin at `/admin`" (proxy scope, headers, import boundaries, CSS isolation, dev command), directory tree comments, and the "Paths" bullet of "Admin shell".
- `docs/data-layer.md`: environment table (remove `ADMIN_HOSTS`, `NEXT_PUBLIC_ADMIN_URL` mentions; add the `APP_WEB_URL` note), "Admin auth (M3)" (cookie names, Path, URLs), "Admin HTTP layering" (BFF base `/admin/api/backend`), the backend-requirements bullets that say `/api/backend/*`.
- `.env.example`: §7.
- Note: `docs/README.md`, `AGENTS.md`, `architecture.md`, `data-layer.md` and plan 0001 already carry uncommitted edits in the working tree; implementation must preserve them.

## 13. Decisions needed from the owner

1. Approve the plan as written (or say what to change).
2. Confirm cookie choice: `__Secure-nn_*` with `Path=/admin` (recommended) rather than `__Host-` with `Path=/`.
3. Admin-only security headers (`frame-ancestors`, `no-store`, `nosniff`, `Referrer-Policy`): include now (recommended). Nonce-based `script-src` CSP: leave out for now (recommended).
4. Ask the backend owner to set `APP_WEB_URL=<site>/admin` for the deployments that serve Admin, and confirm nothing else needs the site root from that variable.
5. Keep the broad proxy matcher with an early return (recommended), or narrow it to `/admin/:path*` after the encoded-path check.

## Implementation notes (as built)

- Everything in sections 3 to 7 was built as written. The proxy keeps the broad matcher with an early return for non-admin paths (decision 5, recommended option); security headers were included, the nonce CSP was first left out and then added on request: `modules/admin/security/csp.ts`, applied by the proxy to `/admin/*` only, with the admin root layout made `force-dynamic` (so `/admin/forgot-password` is no longer prerendered). Unit tests cover the policy and per-request nonces; a production build serves every `<script>` with the nonce. **Not yet verified in a real browser** (hydration, theme script, toasts, dialogs): open `/admin/login` and the dashboard with the console open and look for CSP violations before relying on it.
- `safeNextPath` additionally requires the literal, case-sensitive `/admin` prefix, so `/ADMIN/...` and `/%61dmin/...` fall back to `/admin` (they would 404 after login).
- Verified on the production build (`next start`) without a backend: landing responses carry no admin headers; every `/admin/*` response carries the header set; anonymous `/admin`, `/admin/users?...`, unknown `/admin/xyz` redirect to `/admin/login`; anonymous `/admin/api/backend/*` is 401; `/%61dmin`, `/ADMIN`, `//admin` are gated or normalised; `/adminx` is the landing 404; `/robots.txt` disallows `/admin`; the sitemap has no admin URL; the login page carries no landing JSON-LD or splash.
- **Not yet verified live (needs the dev backend and an admin login):** items 3, 5 to 9 and 11, 12 of section 11 (cookie attributes in devtools, refresh, logout, role rejection, emailed links). Run them before M5 and before pointing production `APP_WEB_URL` at `<site>/admin`.
- The `.kilo/` folder in the repo root (a stray worktree, not tracked) makes `npm run lint` report one error from `.kilo/worktrees/.../splash-screen.tsx`; `npx eslint src next.config.ts` is clean.
