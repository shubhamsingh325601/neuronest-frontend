# Data Layer

How the frontend handles content, validation, and mutations.

## Content Dictionary

`src/lib/content.ts` is the single source of truth for all marketing text, nav links, metadata, and form copy. Components import content from it directly.

## Validation (Zod)

`src/lib/schemas.ts`:

- `parentWaitlistSchema`: Validates name, valid email, and selected context for parents.
- `clinicianSignupSchema`: Validates name, valid email, and area of practice for clinicians.
- `newsletterSchema`: Validates email subscription.
- `FormState`: Standard state shape `{ success, message, errors }`.

## Server Actions

`src/app/actions.ts` (`"use server"`):

- `submitParentWaitlist(prevState, formData)`
- `submitClinicianSignup(prevState, formData)`
- `subscribeNewsletter(prevState, formData)`

All actions are compatible with React 19's `useActionState`, parse FormData safely with Zod, and return field-level errors or confirmation messages.

## Environment

`NEXT_PUBLIC_SITE_URL` optionally overrides the canonical URL used for `metadataBase` (defaults to `https://neuronest.co.uk`).