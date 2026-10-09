# Data Layer

How the frontend handles content, validation and mutations.

## Content

`src/content/*.ts` is the source of truth for all marketing text, nav links, metadata and form copy (`home`, `founder`, `for-parents`, `for-clinicians`, `how-it-works`, `faq`, `privacy`, `site`). `src/content/index.ts` is the barrel; `src/lib/content.ts` re-exports it so older imports keep working.

## Validation (Zod 4)

`src/lib/schemas.ts`:

- `parentWaitlistSchema` — name, valid email, selected context.
- `clinicianSignupSchema` — name, valid email, area of practice.
- `newsletterSchema` — email.
- `FormState` — `{ success?, message?, errors?: Record<string, string[]>, values?: Record<string, string> }`.

## Server Actions

`src/app/actions.ts` (`"use server"`):

- `submitParentWaitlist(prevState, formData)`
- `submitClinicianSignup(prevState, formData)`
- `subscribeNewsletter(prevState, formData)`

All are `useActionState`-compatible: they read `FormData`, run `safeParse`, and return field errors plus the submitted values, or a success message. Valid parent/clinician submissions are forwarded to `GOOGLE_SHEETS_WEBHOOK_URL` when set (logged locally otherwise); webhook failures are logged and do not fail the user's submission. There is no database and no auth.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for `metadataBase`, sitemap and Open Graph (default `https://neuronest.co.uk`) |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Optional lead-capture webhook |
| `API_BASE_URL` | Admin, server only. The backend **origin** without `/v1` (spec paths already include it), e.g. `http://localhost:4000`. Defaults to that in development, required in production. Validated by `modules/admin/config/env.ts` |
| `NEXT_PUBLIC_ADMIN_DATA_SOURCE` | Admin. `live` (default) or `mock`; `mock` serves mock data for every Admin feature. Inlined at build time (`next.config.ts` pins it to `live` when unset) |
| `NEXT_PUBLIC_ADMIN_MOCK_FEATURES` | Admin. Comma list (`dashboard,system`) of features to mock while the rest stay live. Plan §18 called this `ADMIN_MOCK_FEATURES`; it is `NEXT_PUBLIC_` because hooks run in the browser |
| `ALLOW_ADMIN_MOCKS` | Admin. Must be `1` for a **production build** to contain mock sources; otherwise `next build` fails (checked in `next.config.ts` by `assertMockPolicy`) |

Copy `.env.example` to `.env.local`; never commit `.env.local`. The dev and start scripts use port **3001** (`next dev -p 3001`), so the landing is `http://localhost:3001` and the Admin app `http://localhost:3001/admin`. The backend's `APP_WEB_URL` must be the Admin base (`https://<site>/admin`, dev `http://localhost:3001/admin`): the backend appends `/reset-password` and `/complete-account-setup` to it for emailed links.

### Backend requirements for the Admin BFF

- **Rate limits are per identity, not per IP** (backend change). Auth routes (login, signup, verify-email, resend-verification, forgot-password, reset-password, complete-account-setup, refresh, logout, change-password) allow **5 requests / 60 s per identity**: the user when a bearer token is sent, else the email in the body, else the `token` / `refreshToken` in the body. Other authenticated routes allow 100 / 60 s per user. The frontend sends no `X-Forwarded-For` and has no client-IP configuration. Limits are per account: repeated wrong passwords for one email lock that email's login for up to a minute, from any device.
- **429 handling:** the backend answers `RATE_LIMITED` (problem+json) with `Retry-After`. The auth forms show "Too many attempts. Wait N seconds" and disable the submit button with a countdown (`AuthFormState.retryUntil`, `SubmitButton`). The BFF passes 429 and `Retry-After` through; `apiClient` surfaces it as an `ApiError` with `retryAfter`. **No retry loops on auth routes**; `SessionKeeper` waits for `Retry-After` once before its next attempt.
- **Backend CORS is not used.** The browser only talks to same-origin `/admin/api/backend/*` and `/admin/api/auth/*`.
- **Refresh tokens rotate and reuse revokes the family.** The refresh handler is single-flight and memoises old to new tokens for 10 s, in process memory. On a multi-instance deployment two instances can still race and force a re-login (plan §16, accepted residual risk).

## Admin auth (M3)

Tokens live only in httpOnly cookies: `nn_at` (access, `Max-Age` = `expiresIn`) and `nn_rt` (refresh, 30 days) in development; `__Secure-nn_at` / `__Secure-nn_rt` in production. `SameSite=Lax`, **`Path=/admin`** (Admin shares an origin with the landing site, so the tokens are never sent with landing requests; `__Host-` would force `Path=/`), no `Domain`, `Secure` in production. `Path` is leakage control, not a defence against same-origin script. Code: `src/modules/admin/auth/`, `bff/`, `lib/`, `config/env.ts`.

| Piece | Behaviour |
| --- | --- |
| Login Server Action | login, then `GET /users/me`; requires `ADMIN` + `ACTIVE`, otherwise revokes the new refresh token and returns a form error. `INVALID_CREDENTIALS` is always a form error |
| `requireAdmin()` (console layout) | The real gate. No session: `/admin/login`. Access cookie gone or rejected: redirect to `GET /admin/api/auth/refresh?next=` (Server Components cannot set cookies). Suspended or not an admin: `/admin/api/auth/session-ended`, which revokes, clears cookies and lands on `/admin/login?reason=` |
| `/admin/api/auth/refresh` | `GET` (navigation, ignores prefetch and cross-site) and `POST` (SessionKeeper, CSRF-checked). Dead token: clear cookies, `/admin/login?reason=expired`. 429 or backend down: cookies kept, `/admin/session-error` page with a countdown |
| `/admin/api/backend/[...path]` | Allowlist (`bff/allowlist.ts`, method + path), bearer from the cookie, CSRF (`X-NN-Admin: 1` on every call, matching `Origin` on mutations), problem+json returned unchanged. It never refreshes: an expired token is a 401 and the client refreshes once |
| Proxy gate | Cookie **presence** only. Runs for `/admin/*` only. Anonymous pages: `/admin/login?next=`; anonymous `/admin/api/*`: 401 problem+json. `/admin/login` with a session bounces to `next` (must be inside `/admin`, see `safe-next.ts`) unless `?reason=` is present (loop guard). The proxy also forwards the requested path to Server Components in `x-nn-path` |
| `SessionKeeper` | Refreshes at about 80% of the access token's lifetime; `navigator.locks` plus a shared "due" timestamp so tabs do not double-refresh; backs off on 429 |

Error handling is by `code` (`modules/admin/lib/api-errors.ts`), never by status alone.

## Admin HTTP layering

One rule: **nothing outside the transports touches `fetch` or parses a `Response`.**

```
component / store / hook
  └─▶ feature service (typed functions, zod schemas)        e.g. features/users/api
        └─▶ apiClient            lib/api-client.ts   browser -> /admin/api/backend/* (CSRF header, 401 -> refresh once -> retry)
              └─▶ BFF handler    bff/handler.ts      allowlist, bearer from cookie, problem+json passthrough
                    └─▶ backendFetch   lib/server-api.ts  -> API_BASE_URL/v1/*

server code (Server Actions, route handlers, layouts)
  └─▶ createServerApi({ accessToken })   lib/server-api.ts  -> API_BASE_URL/v1/*
```

`lib/http.ts` is the shared core under both clients: `get / post / put / patch / delete`, query serialisation (`buildQuery`), JSON and empty-body handling, optional `schema` (zod) validation of the response, and conversion of every failure to `ApiError` (`code`, `status`, `requestId`, `retryAfter`). Pass a `schema` for anything the UI depends on; a mismatch is a `BAD_BACKEND_RESPONSE`, not an `undefined` crash later. Feature services stay thin: path, query, body, schema, return type. Callers branch on `error.code`.

## Admin data layer (M4)

```
component ──▶ feature hook (TanStack Query)        features/<x>/hooks/
                └─▶ get<X>Api()                    features/<x>/api/index.ts   picks live or mock (dynamic import)
                      ├─▶ live.ts                  thin: path, query, schema -> apiClient
                      └─▶ src/mocks/admin/<x>.ts   same `interface XApi`, in-memory (helpers in _factory.ts)
```

- **Query client** (`lib/query-client.ts`, created once in `providers/providers.tsx`): `staleTime` 30 s, `gcTime` 5 min, refetch on focus, retry once, **never retry a 4xx** (so a 429 is shown, not repeated), mutations never retried. Key factories are in `lib/query-keys.ts`.
- **Lists:** `useCursorList` / `cursorListOptions` in `lib/pagination.ts` is an infinite query over `{ data, nextCursor }` ("Load more"); `cursorPageSchema(item)` validates the envelope. First used by M6.
- **Errors:** `lib/describe-error.ts` turns an `ApiError` into screen copy by `code`; a 429 shows the `Retry-After` wait time. Health polling stops after a 429 until the user retries.
- **Data source:** `config/data-source.ts`. The literal `process.env.NEXT_PUBLIC_ADMIN_*` test must stay inline in each `api/index.ts` so the bundler folds it and drops the mock import from live builds; `next.config.ts` pins both variables to concrete values for the same reason. The MockDataChip lists every mocked feature (`config/shell-stub.ts`).
- **Dashboard:** `GET /v1/admin/summary` returns `invitedClinicians, activeClinicians, activeParents, activePlans, childrenWithAssignedClinician, childrenWithoutClinician` and `deadJobs` (not used by the UI yet). The old `pendingClinicianApplications` field no longer exists; a response without `invitedClinicians` fails validation (`BAD_BACKEND_RESPONSE`).
- **System:** `GET /v1/health` (public) is polled every 30 s. 200 is operational; **503 with a health body is "degraded"** (API up, database down), not an error; an unreachable backend (`BACKEND_UNREACHABLE`) is "down". `ApiError.body` carries the parsed non-problem error body for this.
