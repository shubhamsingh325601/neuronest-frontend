<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NeuroNest Frontend

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Zod 4 · `motion/react` · `lucide-react`.
Public marketing site for NeuroNest, a health companion for parents of children with neurodevelopmental differences. An Admin app is planned in the same codebase. The API lives in the sibling repo `../neuro-nest-backend`.

This file is loaded in every session, so it stays short. Detail lives in `docs/`.

## Rules

- Before saying work is done, run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`; all must pass.
- Server Components by default; add `"use client"` only for hooks, events or motion.
- Marketing copy lives in `src/content/`, never in JSX.
- Merge classes with `cn()` from `@/lib/utils`.
- Forms: Zod schema in `src/lib/schemas.ts` + Server Action in `src/app/actions.ts`, returning `FormState`.
- Next 16 renames middleware to `proxy.ts`. Check `node_modules/next/dist/docs/` for any Next API you are unsure about.
- Never read, print or commit `.env.local`.
- If the working tree has changes you did not make, leave them alone and do not stage them.

## Git

- Commit or push only when asked. Subjects use Conventional style (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Commits and PRs use the configured git identity only. Never add `Co-Authored-By`, "Generated with…", a Claude/AI mention, `--author`, or `-c user.name/user.email`.
- Enforced by `.claude/settings.json` and `.claude/hooks/guard-commit-attribution.mjs`, which blocks violating `git commit` and `gh pr` commands.

## Docs: read only what the task needs

Open a doc only when the task matches its row. Do not read docs "just in case", and do not load several when one will do.

| If the task involves… | Read |
| --- | --- |
| Where code goes, new routes or components, data flow | `docs/architecture.md` |
| Code style, RSC rules, styling and form conventions, commits | `docs/conventions.md` |
| Landing UI, design tokens, fonts, `src/components/ui` | `docs/design-system.md` |
| `src/content`, Zod schemas, Server Actions, env vars | `docs/data-layer.md` |
| Anything Admin (served at `/admin` on the same origin; `proxy.ts`, `src/modules/admin`, `src/mocks/admin`, admin auth) | `docs/plans/0001-admin-app.md`; URL, proxy and cookie rules in `docs/plans/0002-admin-path-routing.md` |

Index of all docs: `docs/README.md`.

## Keeping this up to date

- Put new conventions, architecture and plans in `docs/`, not here. Add a row to the table above only when a new doc is added.
- Tick the checklist in the active plan (`[ ]` → `[x]`) in the same change that finishes the item.
- If a doc contradicts the code, trust the code and fix the doc.
- `CLAUDE.md` only imports this file. Do not duplicate content there.
