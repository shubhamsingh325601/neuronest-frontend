# Data Layer

How the frontend handles content, validation and mutations.

## Content

`src/content/*.ts` is the source of truth for all marketing text, nav links, metadata and form copy (`home`, `for-parents`, `for-clinicians`, `how-it-works`, `faq`, `privacy`, `site`). `src/content/index.ts` is the barrel; `src/lib/content.ts` re-exports it so older imports keep working.

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

Copy `.env.example` to `.env.local`; never commit `.env.local`.

The Admin app will add more variables (backend URL, admin hosts, mock-data flags); they are listed in [plans/0001-admin-app.md](plans/0001-admin-app.md) §19 and move here when implemented.
