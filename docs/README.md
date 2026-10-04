# Docs

Open a doc only when your task matches its "read when" line.

| Doc | Read when |
| --- | --- |
| [conventions.md](conventions.md) | Writing or reviewing code: verification commands, RSC rules, styling, forms, commits |
| [architecture.md](architecture.md) | Deciding where code lives, adding routes/components, understanding data flow |
| [design-system.md](design-system.md) | Touching landing UI, tokens, fonts, or `src/components/ui` |
| [data-layer.md](data-layer.md) | Touching content files, Zod schemas, Server Actions, or env vars |
| [plans/0001-admin-app.md](plans/0001-admin-app.md) | Any Admin app work (Admin at `/admin`, decision 2026-10-05; `proxy.ts`, `src/modules/admin`, `src/mocks/admin`). Holds the milestone checklist to tick |
| [plans/0002-admin-path-routing.md](plans/0002-admin-path-routing.md) | Milestone M4.5: moving Admin to `/admin` on the same origin (proxy, cookies, URL map, inventory, tests). Implemented (see its status) |

## Plans

`plans/NNNN-<name>.md` — one file per plan, numbered from 0001 in this repo's own sequence. Each plan carries its own checklist (`[ ]` / `[x]`); tick items in the same change that completes them.
