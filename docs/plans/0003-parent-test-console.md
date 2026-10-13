# Parent test console, shared chat client, and an elegant AI chat

Status: steps 1 to 4 implemented (code, tests, builds with the flag off and on); step 0 waits on the backend owner; the manual run in step 6 is still to do. This file is self-contained for a new session. Read `AGENTS.md` first, then this plan. Tick the checklist below in the same change that finishes each item.

## Checklist

- [ ] 0. Experts 500: backend migrations applied and the cause confirmed with the `requestId`; `describeError` shows `requestId`; child page expert names verified
  - [x] `describeError` appends `Reference: <requestId>` (test in `lib/data-layer.test.ts`)
  - [x] Child page expert names verified in code: `ChildExperts` resolves each name with `GET users/:id`, and the backend `get-user` service handles `Role.EXPERT`
  - [ ] Owner: reload `/admin/experts`, copy the `Reference:` id from the error, check the backend log for it, run `npm run prisma:deploy` in `neuro-nest-backend` (migrations `20261011090000_add_expert_role`, `20261011121923_add_conversations`, `20261011150000_add_ai_run_client_aborted`), restart it, and confirm the page loads
- [x] 1. `src/modules/chat-client`: types, problem, client, `sse-reader`, `ai-stream` (+ metrics), `conversation-stream`, `ai-chat-state`, all with tests
- [x] 2. Console plumbing: flag, in-memory session store, impersonation, parent picker, banner, expert login, route, nav, allowlist, CSP, `next.config.ts`, `.env.example`
- [x] 3. AI chat UI (phases, smooth text, chips, composer, scroll) and the Diagnostics drawer
  - Built and checked against a throw-away mock backend over a real socket (stream, `AI_CHAT_BUSY` + `Retry-After`, abort). Not yet looked at in a browser: the visual pass (light/dark, 375 px, reduced motion, keyboard) is in step 6.
- [x] 4. Expert test panel (two panes)
- [x] 5. Docs: add this plan to `docs/README.md` and an `AGENTS.md` table row; backend-differences note
- [ ] 6. Verification: typecheck, lint, test and build with the flag off and on; manual run against the backend
  - [x] typecheck, lint, test (567) and build pass with the flag off and on; with it on the CSP carries the backend origin, with it off it does not
  - [ ] Manual run in a browser against the real backend (not done: no backend was running and the browser extension was not connected). Follow "Verification" below, including the visual pass

## Context

The backend dev handed over a spec (`neuro-nest-backend/docs/frontend-handoff-chat-and-test-console.md`) for two jobs:

1. A temporary, feature-flagged **Parent test console** in the admin site. The admin acts as a parent (impersonation) and exercises AI chat, parent-to-expert chat and the live SSE streams.
2. A **shared typed API client + one SSE reader** that the console and the future parent/expert apps both use.

On top of that the owner wants (a) the experts-page 500 checked, (b) the AI chat UI to feel elegant and alive so a parent never feels they are waiting (animations, chips, "what the model is doing" like ChatGPT/Claude), and (c) a list of anything needed from the backend to support that.

Decision already made: **direct browser-to-backend calls** (not the same-origin relay). The backend `CORS_ORIGINS` already lists the Vercel production domain and `http://localhost:3001`; it reflects requested headers, so `Authorization` and `Last-Event-ID` need no backend change. Preview URLs will not work (not in the allowlist).

## Findings that shape the plan

**Experts 500 is not a frontend model or call bug.** I compared `features/experts/api/{types,live}.ts` with the backend (`src/modules/experts`): routes, query params (`status`, `q`, `cursor`, `limit`), bodies and DTO fields all match. The BFF passes backend responses through unchanged, so a 500 on the page is a backend `INTERNAL_ERROR`. Most likely cause: backend DB behind its code (migrations `20261011090000_add_expert_role`, `20261011121923_add_conversations`, `..._add_ai_run_client_aborted` not applied; `GET /experts` filters `role = EXPERT`). A frontend contract problem would show as 502 `BAD_BACKEND_RESPONSE`/400/404, not 500. Not yet confirmed against a running backend. Two small frontend fixes: `describeError` shows no `requestId`, so the next 500 is untraceable; and `GET /children/:id/experts` returns link rows without names (verify the child page joins names).

**Why the AI chat feels like waiting today** (backend read, `send-ai-message.{controller,service}.ts`, `chat-reply.processor.ts`, `vercel-ai.service.ts`):
- Response headers (and the heartbeat timer) start only on the first raw provider token (`sink.start()`, service line ~306). Before that the client receives **zero bytes**: DB checks, persisting the message, building context and the model's time-to-first-token are all silent.
- Even after that, text is held until a whole sentence passes the safety check, and the start is held while it could still be `[[OFF_TOPIC]]`. So the first visible text arrives in sentence-sized lumps.
- `vercel-ai.service.ts` handles only `text-delta`, `error`, `abort`, `finish` from `result.fullStream`; the other SDK parts (`start-step`, `reasoning-*`, etc.) are dropped. The wire protocol is custom: `delta | retract | done | error`. No `status`/phase event exists.
- Model is told: plain sentences only, no markdown/lists/emoji, 3 to 5 sentences, max 400 output tokens. So **no markdown renderer is needed**; replies are short.

**Do not add the `ai` / `@ai-sdk/react` packages to the frontend.** `useChat` expects the AI SDK UI-message protocol; this backend deliberately uses its own safety-gated protocol with `retract`. A ~150-line reader is simpler and is also what the React Native app needs (`expo/fetch`). Server-side `smoothStream` is also the wrong place, because sentences are gated for safety. Smoothing happens on the client.

**Admin-app constraints:**
- Admin tokens never reach the browser (httpOnly cookies + BFF allowlist). The console only holds the parent/expert token in memory. The one admin-token call, `POST users/:id/impersonate`, goes through the BFF and needs an allowlist entry (`bff/allowlist.ts`).
- CSP is `connect-src 'self'` (`security/csp.ts`, called in `src/proxy.ts:34`). A cross-origin `fetch` is blocked by the browser before CORS is even checked, so the backend origin must be added when the flag is on.
- `NEXT_PUBLIC_` vars must be pinned in `next.config.ts` `env` (existing pattern).
- Lint: admin code may use only semantic colour tokens (no hex/rgb/oklch/palette classes); admin may import only `@/lib/utils` from `@/lib`; `@/modules/chat-client` is not restricted. Vitest runs in `node` and includes only `src/**/*.test.ts` (no jsdom), so test pure logic.
- The BFF `backendFetch` has a 15 s timeout, which is another reason streams must not go through it.
- Next 16 differs from older versions: read `node_modules/next/dist/docs/` before writing the route file and the `notFound()` gate.

## Structure: what stays vs what gets deleted

```
src/modules/chat-client/                 KEEP. Framework-free TS, no React/Next/DOM-only APIs. Shared with RN apps.
  types.ts            Zod schemas + types: Message, Conversation, Topic, Child, ImpersonationResult, Problem...
  problem.ts          ChatApiError(status, code, requestId, retryAfter) + parse application/problem+json
  client.ts           createChatClient({ baseUrl, getToken, fetch? }) typed calls (topics, children, ai-conversations,
                      conversations, messages, close, summaries, auth/login, users/me)
  sse-reader.ts       parseSse(stream) async iterator -> { event, id, data } | { comment }; optional onChunk hook
  ai-stream.ts        sendAiMessage(...) -> typed events + StreamMetrics collector (ttfb, firstDelta, total, deltas,
                      chunks, maxEventsPerChunk, maxGap, heartbeats); AbortController; abort-after-first-delta option
  conversation-stream.ts  gapless live algorithm (history -> events with Last-Event-ID -> dedupe by seq ->
                      backoff+jitter reconnect -> resync paging -> closed/purged stop); connect()/disconnect()/
                      openExtra(); injected fetch + timers so it is testable
  ai-chat-state.ts    pure reducer for the AI transcript (phases below)
  *.test.ts           see Tests

src/modules/admin/features/parent-test-console/    DELETE IN ONE COMMIT (together with the marked touch points)
  flag.ts, console.css, state/session.ts (zustand, in-memory only, no persist)
  api/ (impersonate via the existing admin apiClient), components/, page component, smooth-text.ts (+test)
```

Touch points outside the folder (each marked with a `parent-console:` comment so `grep` finds them for removal):
- `src/app/(admin)/admin/(console)/parent-test/page.tsx`: one-line page that calls `notFound()` when the flag is off.
- `navigation/nav-config.ts`, `navigation/paths.ts`, `navigation/breadcrumbs/registry.ts`: nav item/route/breadcrumb only when the flag is on. Update `nav.test.ts` and `literal-paths.test.ts`.
- `bff/allowlist.ts`: add `POST users/:id/impersonate` only when the flag is on (extend the allowlist test).
- `security/csp.ts` + `src/proxy.ts`: `buildAdminCsp(nonce, dev, extraConnectSrc?)`; append the backend origin only when the flag is on (extend `csp.test.ts`).
- `next.config.ts`: pin `NEXT_PUBLIC_ADMIN_PARENT_CONSOLE` (`"1"` enables). The only variable to set is that flag; the backend origin the browser needs is derived from the existing `API_BASE_URL` (default `http://localhost:4000`) into an internal `NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL` pin, only while the flag is on. `.env.example`: document the flag.
- `docs/plans/0003-parent-test-console.md`: checklist, removal list, backend requests, and "where the backend behaved differently". Add it to `docs/README.md` and one row to the `AGENTS.md` table.

## Implementation steps

### 0. Experts 500 (small, do first)
- Ask the owner for the `requestId` of the failing `GET /admin/api/backend/experts` and check the backend DB. Fix on their side: `npm run prisma:deploy` in the backend, regenerate the client, restart.
- Frontend: add `requestId` to the error copy in `lib/describe-error.ts` (shown in `ErrorState`), with a unit test. Verify the child page's expert list joins expert names (`GET experts/:id` or `GET experts?limit=100`) since `GET children/:id/experts` returns link rows only.

### 1. `chat-client` (build once, test hard)
- `sse-reader.ts`: `TextDecoder({stream:true})` (handles multi-byte UTF-8 split across chunks); line splitting on `\r\n`, `\n`, lone `\r`; blank line dispatches a block; lines starting `:` are comments (heartbeats); multi-line `data:` joined with `\n`; one leading space after the colon stripped; `id:`/`event:`/`retry:`; a trailing block with no blank line at EOF is discarded; leading BOM ignored.
- `ai-stream.ts`: `POST` with `Accept: text/event-stream`; non-2xx becomes `ChatApiError` from problem+json (branch on `code`); 2xx yields `status | delta | retract | done | error` events (unknown event names ignored for forward-compat). Metrics via `performance.now()`; chunk accounting at the byte-reader level (before parsing); flags: `bufferedEvents` when one chunk holds 3 or more events, `streamDropped` when a gap between any bytes exceeds 15 s plus 2 s tolerance. Never stores or logs text, tokens or headers in metrics.
- `conversation-stream.ts`: exactly the 6-step algorithm from the spec. Stop on 401/403/404/422; backoff 1, 2, 4 s up to 30 s with jitter; `429 TOO_MANY_STREAMS` waits longer (honour `Retry-After`). `disconnect()` aborts the fetch with no auto-reconnect until `connect()`. Emits state: `connected | reconnecting | ended`, `lastEventId`, heartbeat count, event log `{name, at}` (no text).
- Optimistic send helper for human chats: message shown as `sending` with `clientMessageId`; same id reused on network-failure retry; 201 marks sent and bumps `lastSeq`.
- `ai-chat-state.ts` reducer phases: `idle -> submitted -> thinking -> writing -> done`, plus `retracted`, `failed(code)`, `closed`. `submitted/thinking` are derived client-side today (see below) and driven by `status` events when the backend adds them.

### 2. Console plumbing
- `flag.ts`: `isParentConsoleEnabled()` and the API URL; page returns `notFound()` when off. 404 `IMPERSONATION_DISABLED` renders "Impersonation is switched off on the server" and hides the console body.
- `state/session.ts` (zustand, no persist): `parentToken`, `expiresAt`, `parent {id,name,email}`, `expertToken`, `expert`. Tokens are never put in localStorage, cookies, the URL, logs or query keys. Exit drops the token and aborts all streams.
- Parent picker: reuse the existing users hooks/API (`GET users?role=PARENT`, cursor paging, search by name/email client-side since `/users` has no `q`). "Act as this parent" calls `POST users/:id/impersonate` via the admin `apiClient`; map `IMPERSONATION_TARGET_NOT_ALLOWED`, `ACCOUNT_NOT_ACTIVE`, `USER_NOT_FOUND`.
- Persistent sticky banner: "Acting as {name} ({email}). Expires in mm:ss. [Exit]". Warns under 5 min, auto-exits at 0, and any `401 INVALID_TOKEN` shows "Session expired, act as this parent again". No change-password or deactivate controls exist (they return `403 IMPERSONATION_RESTRICTED`).
- Expert login form (email/password, rate limit 5/min noted) -> `POST auth/login` direct, then `GET users/me` to confirm role EXPERT; password field cleared immediately.

### 3. The AI chat (the elegant part)
Layout: chat column (max ~720 px, centred) plus a collapsible **Diagnostics** drawer (the metrics table). On mobile the drawer becomes a sheet (`ui/sheet.tsx`). The admin shell's `max-w-7xl py-6` main area means the chat uses `h-[calc(100dvh-11rem)]` with an internal scroller.

**Flow:** pick child (from `GET children`) -> empty state with greeting and **topic chips** from `GET /ai-chat/topics` (never hard-coded; `AI` starts a chat, `ROUTE` shows an "opens in app" chip, `UNAVAILABLE` shows a disabled "Coming soon" chip) -> `POST children/:id/ai-conversations` -> composer.

**What the parent sees, phase by phase (so nothing ever looks stuck):**
1. *Sent:* their message appears instantly (optimistic, slide-up), composer clears and focus stays.
2. *Thinking:* AI avatar "orb" breathes; a shimmering label. Today derived honestly from client timing only: "Thinking…" -> after about 6 s "Still working on it…" -> after about 15 s "Taking longer than usual", plus a Stop button. No invented claims about what the model is doing. When the backend adds `status` events (see requests), labels become accurate: "Reading your question" / "Thinking" / "Checking the answer" / "Writing".
3. *Writing:* deltas arrive sentence-by-sentence, so a client **smooth-text engine** reveals them by word on `requestAnimationFrame` at an adaptive rate (never more than about 350 ms behind the real stream, so it reads like flowing typing, not lumps). Only the freshly revealed tail words are animated spans (fade + 2 px rise + 3 px blur -> 0); settled text is one string, so the DOM stays small. Soft blinking caret at the end. `prefers-reduced-motion`: append instantly.
4. *Footer:* the trailing "This is AI guidance, not a diagnosis…" delta renders as a separate muted block with an info icon, fading in last (detected by the known prefix until the backend sends it as its own event).
5. *Done:* caret disappears; a small action row fades in (copy). Message state `REDIRECTED` gets a calm "I can only help with…" style plus the topic chips again.
6. *Retract:* the bubble cross-fades to the safe text inside a soft card with a shield icon and a one-line label that the answer was replaced for safety.
7. *Error after start:* inline failed state that keeps the user's message and offers "Try again" with the **same** `clientMessageId`. Friendly copy per code (`AI_RATE_LIMITED`/`AI_BUDGET`/`AI_TIMEOUT`/`AI_PROVIDER`/`AI_FAILED`/`AI_INVALID_OUTPUT`/`AI_BLOCKED`/`CONVERSATION_CLOSED`).
8. *Refused before the stream* (JSON problem): `AI_CHAT_BUSY` -> composer waits with a quiet note; `AI_CHAT_LIMIT_REACHED` -> limit notice; `CONVERSATION_CLOSED` / `AI_CHAT_OFF_TOPIC_LIMIT` / `done.conversationClosed` -> composer disabled with "Pick a topic" chips; `MESSAGE_TOO_LONG`, `AI_DISABLED`, `AI_UNAVAILABLE`, `409 CLIENT_MESSAGE_ID_IN_USE`, `422`s -> inline notices.

**Composer:** auto-growing textarea (1 to 6 rows), Enter sends, Shift+Enter newline, character counter appearing at 80% of the limit (1000 default; real value requested from the backend), send button morphs to a Stop square while streaming (aborts the fetch). **Scrolling:** stick-to-bottom that pauses when the user scrolls up, with a "New reply" pill to jump back.

**Motion tech:** `motion/react` (already a dependency; `AnimatePresence` for bubbles/chips, staggered chip entrance, `MotionConfig reducedMotion="user"`) plus CSS keyframes in `console.css` (`pc-shimmer`, `pc-orb-breathe`, `pc-caret`, `pc-word-in`, `pc-chip-in`) built only from existing semantic tokens (`--primary`, `--muted`, etc.; the admin base layer already clamps CSS animation durations under reduced motion). Verify `color-mix` passes the admin lint rules; otherwise use opacity layers.

**Diagnostics drawer (spec section 3):** table + "Copy as CSV" with the columns: ttfb, firstDelta, total, deltas, chunks, max events per chunk (flag), max gap (flag), heartbeats, `done.state`, `conversationClosed`, `error.code`, HTTP status, `requestId`. Controls: "Abort after first delta" toggle, "Abort mid-stream" button, "Resend same clientMessageId". Message text is never written to the table or CSV.

### 4. Expert test panel (spec section 5)
Two side-by-side panes (Parent and Expert), each a `conversation-stream` instance. Per pane: message list (human-chat bubble variant), connection chip (connected/reconnecting/ended), last event id, heartbeat count, event-name+time log (no text). Shared actions: start chat with expert (`POST children/:id/conversations`; `409 NO_EXPERT_ASSIGNED` links to the Experts page), send as parent / send as expert, close chat, per-pane disconnect/reconnect (tests resume), "send 5 while disconnected, then reconnect" (tests replay), and "open a second stream for the same user" (shows the 429 per-user cap). All streams abort on unmount and on Exit.

### 5. Docs and notes
`docs/plans/0003-parent-test-console.md` with a tickable checklist, the removal checklist (delete the folder and route, revert the `parent-console:` lines, drop the two env vars; `chat-client` stays), the backend requests below, and the "backend behaved differently" note (so far: headers/heartbeat only after the first provider token, so no bytes during thinking; AI stream has no `id:` lines; replay arrives as one big delta that already includes the footer; login returns tokens only, with no `user` object, so the console calls `users/me`; `PUT experts/:id/children` and the child-experts lookup return link rows without names).

## Requests for the backend dev (additive, backwards compatible; the UI works without them)
1. **Send headers immediately** after all synchronous refusals pass (busy, closed, limits, validation, idempotency): move `sink.start()` to just before `streamChat`. Pre-stream errors keep their HTTP statuses; model-time errors become `error` events (the `if (!started) throw` path needs an `error` event once headers are sent). Heartbeat then also covers the thinking period. This single change removes the dead air.
2. **`event: status {phase}`** with `thinking` (model call open, no token), `checking` (tokens arriving but a sentence is held for the safety check; emit only on transitions), `writing` (first delta released). Forward neutral phase names only, **never** model reasoning text (it would bypass the safety filter). Suggested places: the `for await` in `send-ai-message.service.ts` (~303) when the processor returns no actions.
3. **Footer as its own event** (`event: footer {text}`) instead of a trailing `delta` with a `\n\n` prefix, so the UI never has to detect it.
4. **Expose limits:** `maxMessageChars`, `dailyRemaining`, `perChatRemaining` (e.g. on `GET /ai-chat/topics`), so the composer shows a real counter and "N messages left today".
5. **Per-topic `starters: string[]`** (authored, safe) for tap-to-send chips; optionally later, safety-checked follow-up suggestions after a reply.
6. Make sure `X-Request-Id` is set on the SSE response (already CORS-exposed) so the diagnostics table has an id for successful streams; `Retry-After` on `AI_CHAT_BUSY` / `TOO_MANY_STREAMS`.
7. Operational: `IMPERSONATION_ENABLED=true` and `AI_ENABLED=true` on the test backend; the experts migrations applied.

## Tests (vitest, node, `*.test.ts`)
- `sse-reader`: block split mid-line / mid-`data:` / mid-UTF-8-character, `\r\n` and lone `\r`, comment-only blocks, multi-line `data:`, blank-line dispatch, `id` without `event`, discarded unterminated tail, BOM.
- `ai-stream`: delta/retract/done/error sequences, pre-stream problem+json mapping by `code`, metrics (chunk vs event counts, buffered flag, gap flag), abort after first delta.
- `conversation-stream` (fake fetch + fake timers): dedupe by `seq`, resume sends `Last-Event-ID`, backoff growth with jitter bounds, no reconnect on 401/403/404/422, 429 waits longer, resync paging to `lastSeq`, `closed`/`purged` stop, `disconnect()` stays disconnected.
- `ai-chat-state` reducer transitions; `smooth-text` rate/word-boundary maths; `describe-error` requestId; allowlist, CSP and nav tests extended for the flag.
- No secrets or message text in any metrics/log fixture; a test asserts that metrics objects contain only numbers, booleans and codes.

## Verification
1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass (project rule), once with the flag off (console absent: no nav item, `/admin/parent-test` is 404, no CSP change, impersonate not allowlisted) and once with the flag on.
2. Manual, with the backend running (`IMPERSONATION_ENABLED=true`, `AI_ENABLED=true`, `CORS_ORIGINS` containing `http://localhost:3001`) and the admin on `npm run dev` (port 3001) with `NEXT_PUBLIC_ADMIN_PARENT_CONSOLE=1` and the API URL set:
   - Impersonate a **test** parent: banner and countdown, Exit, expiry.
   - AI chat: topic chips, thinking states, smooth sentence reveal, footer block, stop, retry with the same `clientMessageId`, resend (replay), off-topic x3 closes the chat, busy/limit/too-long notices, diagnostics table and CSV (check the chunk and gap flags against the browser Network tab).
   - Expert panes: create expert and assign a child in the admin first, then live two-way chat, disconnect/reconnect resume, "send 5 while disconnected", second stream hits the per-user cap, close chat.
   - Visual: light and dark, 375 px width, `prefers-reduced-motion`, keyboard use (Enter/Shift+Enter, focus order, aria-live on the streaming region).
3. Confirm no token or message text appears in the console, URL, storage, or the CSV.
4. Do not commit or stage anything unless asked; leave unrelated working-tree changes alone.

## Removal checklist (one commit)

The console is temporary. To remove it:

1. Delete `src/modules/admin/features/parent-test-console/` and `src/app/(admin)/admin/(console)/parent-test/`.
2. Revert every line marked `parent-console:` (find them with `grep -rn "parent-console:" src next.config.ts`): `next.config.ts` (the two env pins), `src/proxy.ts` (CSP argument and import), `security/csp.ts` (the `extraConnectSrc` parameter), `bff/allowlist.ts` (the `PARENT_CONSOLE_RULES`), `navigation/nav-config.ts`, `navigation/breadcrumbs/registry.ts`, `navigation/paths.ts` (`parentTest`), and the matching test blocks in `bff/handler.test.ts`, `security/csp.test.ts` and `navigation/nav.test.ts`.
3. Drop the `NEXT_PUBLIC_ADMIN_PARENT_CONSOLE` block from `.env.example` and from any deployed environment.
4. Remove the plan row from `docs/README.md` and `AGENTS.md`.
5. **Keep `src/modules/chat-client/`**: the parent and expert apps reuse it. It has no React, Next or admin imports.

`lib/describe-error.ts` (the `Reference:` request id) is a general improvement and stays.

## Where the backend behaved differently from its handoff

Taken from reading the backend source while writing this plan. **Not yet seen against a running backend**: confirm each in the manual run (step 6) and tell the backend owner about any that still hold.

- The AI send stream sends **no bytes** (not even headers or a heartbeat) until the first raw provider token, so the thinking time is silent. The UI therefore words the wait from the clock (`ai-copy.ts`) and measures it in the Diagnostics table (TTFB is close to the first delta).
- The AI stream has no `id:` lines (only the conversation events stream does).
- The footer ("This is AI guidance, not a diagnosis...") is a trailing `delta` with a `\n\n` prefix, not its own event, and a replay (same `clientMessageId`) arrives as one large delta that already includes it. `splitFooter` in `ai-chat-state.ts` handles both; a `footer` event is already parsed for when the backend adds it.
- `POST auth/login` returns tokens only (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`), no `user`, so the expert sign-in calls `GET users/me` to check the role.
- `PUT experts/:id/children` and `GET children/:id/experts` return link rows without names; the child page resolves each name with `GET users/:id`.
- Admin side, not backend: `auth/backend-auth.ts` `profileSchema` lists the roles PARENT, CLINICIAN and ADMIN only. That is fine for admin sessions (a non-admin is refused anyway) but would reject an EXPERT profile if it were ever reused.

## Implementation notes

- Streams run direct browser to backend (no BFF relay). The CSP `connect-src` gains the backend origin only while the flag is on; the backend must list this admin origin in `CORS_ORIGINS`.
- Tokens: parent and expert tokens live in the zustand store `state/session.ts` (memory only; a test scans the file for storage APIs). `useActAsParent` resolves to nothing so the token never sits in the React Query mutation cache. Parent data in the query cache is dropped when the session ends.
- `ConversationStream` advances `lastSeq` only over a gapless run, so a `POST` result that is ahead of the stream cannot make it skip the messages in between (the handoff's "set lastSeq if higher" would). That value is also what `Last-Event-ID` carries.
- The smooth-text engine fixes its rate when words arrive, so catch-up is linear and ends within 350 ms. A rate proportional to the backlog decays and misses the cap (caught by `smooth-text.test.ts`).
- Both console panels stay mounted when switching tabs, so the transcript and live streams survive.
- An expert stream that ended with a refused token stays ended: sign the expert out and in to build a fresh one.
