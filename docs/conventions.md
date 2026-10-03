# Conventions

Rules for writing and verifying code in this repo. Architecture lives in [architecture.md](architecture.md); visual rules in [design-system.md](design-system.md).

## Verify before calling work done

```bash
npm run typecheck   # tsc --noEmit, must be 0 errors
npm run lint        # ESLint 9 (eslint-config-next core-web-vitals + typescript)
npm run build       # Next production build; every route must compile
```

Run from the repo root. Keep `.env.local` untracked (it is gitignored; `.env.example` is the template).

## Server vs client components

- Pages and layouts are Server Components by default.
- Add `"use client"` only for hooks (`useState`, `useEffect`, `useActionState`, `useRef`), `motion/react`, or DOM event handlers.
- Keep client islands small and push them down the tree.

## Content

- Marketing copy, labels, nav items and structured data live in `src/content/*.ts`. Never hard-code them in JSX.
- Import from `@/content` (or the `@/lib/content` compatibility barrel).

## Styling

- Landing tokens are CSS custom properties in `src/app/globals.css` (see [design-system.md](design-system.md)). There is no Tailwind `@theme` block, so utilities like `bg-coral` do not exist; use the semantic CSS classes or arbitrary values already used nearby.
- Merge conditional classes with `cn()` from `@/lib/utils`.
- Fonts: `font-serif` (Lora) headings, `font-script` (Caveat) eyebrows, `font-sans` (Inter) body/UI.
- Respect `prefers-reduced-motion` for any new animation.

## Forms and mutations

- Zod 4 schema in `src/lib/schemas.ts` → Server Action in `src/app/actions.ts` → return `FormState` (`{ success?, message?, errors?, values? }`).
- Signature: `(prevState: FormState, formData: FormData) => Promise<FormState>` so it works with `useActionState`.
- Details and env vars: [data-layer.md](data-layer.md).

## Code style

- TypeScript strict; no `any` without a comment explaining why.
- Path alias `@/*` → `src/*`.
- `.editorconfig`: UTF-8, LF, 2-space indent, final newline, trimmed trailing whitespace (Markdown excepted).
- Match surrounding naming and comment density; comment only the non-obvious why.
- Icons: `lucide-react` only.

## Next.js 16 reminders

- Middleware is now `proxy.ts` (Node runtime). Read `node_modules/next/dist/docs/` before using any Next API you are not certain about.
- Multiple root layouts (route groups) cause a full page load between them.

## Git

- Commit only when asked. Conventional-style subjects (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Commits and PRs go out under the configured git identity (`git config user.name` / `user.email`). No AI co-author trailers, no "Generated with" footers, no `--author` or identity overrides.
- This is enforced by `.claude/settings.json` (empty `attribution`) and `.claude/hooks/guard-commit-attribution.mjs` (a PreToolUse hook that rejects violating `git commit` / `gh pr` commands).
- Never stage unrelated changes or files that contain secrets.
