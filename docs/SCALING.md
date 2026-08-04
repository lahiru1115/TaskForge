# Scaling TaskForge — Phased Roadmap

## Context

TaskForge is feature-complete against `docs/PLAN.md` — every checkbox through Phase 4 is ticked. The question is no longer "what's missing from the feature list" but "what breaks when this stops being a demo with 50 seeded tasks."

Exploration surfaced one connecting insight that drives the whole sequence below:

**The tenancy gap and the performance gap are the same gap.** `visibilityFilter()` (`taskforge-backend/src/controllers/task.controller.ts:20-23`) returns `{}` for admins — an admin sees *every task in the database* — and `{$or:[{createdBy},{assignedTo}]}` for everyone else. That `$or` spans two fields, so **no single compound index can serve it**, and the sort fields (`createdAt`, `dueDate`, `priority`) are unindexed on top. Search is `{$regex, $options:'i'}` on `title` (`task.controller.ts:60-62`), which no index can serve either.

Introducing a workspace boundary collapses that `$or` into a single equality on `workspace` — which is exactly the selective leading key that makes every compound index possible. **So multi-tenancy must land before the index work, not after.** Doing indexes first means redoing all of them.

The third gap — nothing was verifiable — is what Phase 0 closed: CI, a Vitest harness on both packages, and a set of zero-risk runtime fixes (see below, all done). What's still missing there — structured logging, error tracking, metrics — is Phase 5's job.

There was also live doc drift undercutting the repo's credibility: `docs/PLAN.md` claimed a Render+Vercel deploy while a separate AWS guide described a different, unexecuted target, cited stale dependency versions, and checked off a port fix that hadn't landed. Also resolved in Phase 0 — the AWS guide is gone, `docs/DEPLOYMENT.md` documents the real topology, and `docs/PLAN.md` now matches the code.

**Intended outcome:** six independently shippable phases taking TaskForge from a single-tenant demo to a multi-tenant, real-time, tested, observable application.

**Framing:** portfolio project, moderate refactor. Stack stays MongoDB + Express + React. Choices favour what a reviewer can *see working* and what holds up in an interview over what would be strictly optimal at real traffic.

---

## Design decisions

Six choices that determine everything downstream. One recommendation each.

### 1. Tenancy shape → `Workspace` + `WorkspaceMember` join collection, addressed by **slug in the URL path**

```
Workspace       { name, slug (unique), owner→User, settings }
WorkspaceMember { workspace, user, role: owner|admin|member|viewer, status: active|invited }
                  unique { workspace:1, user:1 } · { user:1, status:1 } · { workspace:1, role:1 }
```

Rejected: an *embedded members array* breaks "list my workspaces" (unindexed `$elemMatch` scan), caps at the 16MB document limit, and turns role updates into positional-operator work. A *`workspace` field on `User`* locks a user to one tenant, which kills the workspace switcher — the single most visually obvious payoff of this phase.

**Addressing: `/api/workspaces/:slug/tasks/...`, frontend at `/w/:slug/board`.** Not a header, not a subdomain. A header is invisible — a controller that forgets to read it leaks silently. A path segment means you *cannot* route to `listTasks` without passing through `resolveWorkspace` first, so tenancy becomes structural rather than conditional. Subdomains need wildcard DNS that Vercel/Render preview deploys don't give cleanly. `user.activeWorkspace` as server state means two tabs fight each other and URLs aren't shareable.

**`User.role` gets demoted to a platform staff flag.** Today `role === 'admin'` returns `{}` from `visibilityFilter` — every task in the database. That *is* the leak. After Phase 1, task/comment authorization consults **only** `WorkspaceMember.role`; `User.role` guards a new `/api/admin/*` ops surface and touches no tenant data.

Within a workspace, all members see all workspace tasks — that's what a workspace *is*. The old per-user narrowing survives as an optional `?mine=true` **UI filter, not a security boundary**. This is the collapse that makes Phase 2 possible.

### 2. Real-time → **socket.io**, not SSE

Render's free tier proxies WebSockets fine but spins instances down after ~15 min idle, dropping every connection. socket.io gives automatic reconnect with backoff, HTTP long-polling fallback, rooms, and acks out of the box. It also gives a client→server channel, which presence and typing indicators need and SSE cannot provide. Single Node process means no adapter is needed — leave `@socket.io/redis-adapter` as a named, documented seam so "how does this scale to N instances?" has a two-sentence answer.

### 3. Caching → **one interface, two drivers**

Define `Cache { get, set, del, delByPrefix }` in `taskforge-backend/src/lib/cache.ts`; pick the driver from `env.redisUrl`. `ioredis` against Upstash free tier in production (long-lived process, so the TCP client beats their REST client and gives pub/sub for later); `lru-cache` fallback when `REDIS_URL` is absent. The repo then clones-and-runs with zero infra and CI needs no service container — and the answer is *"cache is an interface, Redis is a driver"* rather than *"I bolted Redis on."*

### 4. Search → **compound `$text` index with a tenant equality prefix**

`{ workspace: 1, title: 'text', description: 'text' }`, weights `{ title: 10, description: 1 }`. This is MongoDB's documented *partitioned text index* pattern: the query **must** include an equality match on `workspace`, so the tenant boundary is enforced by the index itself.

Not Atlas Search — the index definition would live in the Atlas UI *outside the repo*, so it isn't reviewable or reproducible, and it can't run under `mongodb-memory-server`, which would break CI. Keep regex as a fallback under 3 characters, where `$text` stemming does nothing useful.

### 5. Testing → **Vitest everywhere, three narrow suites**

Harness in Phase 0 (smoke only, to prove it runs in CI); the real suite in Phase 2 once the authorization model has settled.

The minimum set that gives genuine signal is one table-driven backend suite: **the authz matrix** — every workspace role × every mutating endpoint × in-workspace vs out-of-workspace, asserting the 404-not-403 policy holds. That one file is worth more than 200 unit tests and is itself a portfolio artifact: a reviewer reads the table and learns the entire security model. `app.ts` already exports the app separately from `server.ts`, so supertest works with no refactor.

Frontend: ~6 tests, **pure logic only** — the fractional-rank computation, the debounce hook, the `applyTaskEvent` cache reducer. Broad component coverage is how a test suite becomes a second project. E2E: Playwright, exactly 2 specs (auth round-trip; create-task-then-drag), for the CI trace/video artifacts.

### 6. Doc and env cleanup → **Phase 0, non-negotiable**

A reviewer who follows a deployment guide and finds the referenced files missing will discount everything else in the repo. ~30 minutes protecting the credibility of six phases. Done — see `docs/DEPLOYMENT.md` and the Phase 0 checklist below.

---

## Phase 0 — Credibility floor, CI, zero-risk wins · **S–M**

Ships first: nothing here touches the data model, and everything downstream needs the harness.

**Docs truth-up**
- [x] Add `docs/DEPLOYMENT.md` covering the real Render + Vercel topology, env var tables, and the cross-site cookie/CORS reasoning. The stale AWS/EC2 alternative-deployment guide was removed rather than kept — it referenced files (`ecosystem.config.cjs`, `amplify.yml`) that never existed in the tree.
- [x] Fix `docs/PLAN.md`: React 19 / Router v7 (line 7), `SameSite=None` in prod (line 39), uncheck line 70.
- [x] New `docs/ARCHITECTURE.md` with a mermaid request-flow diagram — this becomes the file you link in applications.

**Real bugs**
- [x] Standardize on port `3000`: backend default (`config/env.ts`), both `.env`/`.env.example` pairs, and the Axios fallback (`src/lib/api.ts:4`).
- [x] Move `taskforge-backend/src/seed.ts` → `src/scripts/seed.ts` (`reset-db.ts` is already there); update `package.json`.

**Infra as code**
- [x] `render.yaml` (web service, now including `healthCheckPath: /api/health`), `taskforge-frontend/vercel.json` (SPA rewrite so `/tasks/:id` deep links don't 404, plus security headers).

**CI + harness**
- [x] `.github/workflows/ci.yml`: backend (lint → build → test) and frontend (lint → build), npm cache keyed on lockfiles. `tsc`/`tsc -b` already type-check as part of `build` in both packages, so there's no separate type-check step.
- [x] Add `vitest` + `supertest` + `mongodb-memory-server` (backend), `vitest` + Testing Library (frontend), `vitest.config.mts`/`vitest.config.ts` in each. **Three smoke tests only** to prove the harness: register→login→me, create→list task, 401 unauthenticated. Frontend harness has zero tests yet (`passWithNoTests: true`) — the real suite lands in Phase 2.
- [x] Add `oxlint` + a `lint` script to the backend — it had no lint script at all before this. Also fixed the one warning it immediately surfaced: an unused `generateNKeysBetween` import in `task.controller.ts`.

**Zero-risk runtime wins**
- [x] `app.ts`: `compression()` before routes — populated task-list JSON compresses ~80%.
- [x] New `routes/health.routes.ts`: `GET /api/health` (liveness, no DB) and `/api/health/ready` (mongoose `readyState` + ping). Verified live against a running server, not just type-checked.
- [x] `server.ts`: capture `app.listen`'s return; on `SIGTERM`/`SIGINT` → `server.close()` → `disconnectDB()` → exit, with a 10s force-exit timer. Render sends SIGTERM on every deploy; previously in-flight requests were dropped. Implementation is the standard Node/Express pattern and type-checks clean; end-to-end signal delivery wasn't reliably verifiable through Git Bash on Windows (background node processes detach from the MSYS session and don't consistently receive emulated POSIX signals) — worth a real check once this is actually deployed to Render.
- [x] `config/db.ts`: `maxPoolSize: 10, minPoolSize: 2, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000`.
- [x] `models/LoginEvent.ts`: TTL index on `createdAt` (90d) + `{ email:1, createdAt:-1 }`. Previously zero indexes on an append-only collection.
- [x] `task.controller.ts`: replaced the sequential `await task.save()` loop in `bulkUpdateTasks` (up to 200 round trips) with `updateMany` + one re-`find` for the populated response — mirroring what `bulkDeleteTasks` already did.

**Demonstrates:** CI on day one, docs that match the deploy, awareness of SIGTERM and connection pools.

---

## Phase 1 — Workspaces (the anchor phase) · **L**

Highest-value phase; every later phase is better because this landed first.

- [x] **New models:** `Workspace.ts`, `WorkspaceMember.ts` (shapes above), and `Invite.ts` — `{ workspace, email, role, tokenHash, invitedBy, expiresAt, acceptedAt }`. Token is 32 random bytes; store the **SHA-256 hash**, never the token. TTL index on `expiresAt` (absolute-expiry variant, `expireAfterSeconds: 0`). No `settings` field on `Workspace` yet — the original shape sketch included one, but nothing in any phase defines what it holds, so it's left out until something needs it.
- [x] **Schema changes:** add `workspace: { type: ObjectId, ref: 'Workspace', index: true }` to `Task.ts`, `Comment.ts`, **and** `Activity.ts` — optional for now, flips to `required: true` after the migration runs (see below). Denormalizing onto Comment/Activity lets you scope-check without loading the parent task.

**New middleware — `src/middleware/workspace.ts`**
- [x] `resolveWorkspace`: `params.slug` → loads workspace + caller's active membership → **404s non-members** (never 403 — don't leak workspace existence) → attaches `req.workspace` / `req.membership`. Filters membership on `status: 'active'`, so an `invited`-but-not-yet-accepted row doesn't grant access.
- [x] `requireWorkspaceRole('owner', 'admin')`. Extended `src/types/express.d.ts` with `req.workspace` / `req.membership`. Not wired into any routes yet — that lands with the routing rewrite.

**Routing + authorization rewrite — split into two parts; Part A done, Part B not started.**

**Part A — task/comment routes, done:**
- [x] Nested the task/comment surface: `router.use('/:slug/tasks', resolveWorkspace, taskRoutes)` in the new `workspace.routes.ts`, `Router({ mergeParams: true })` in `task.routes.ts`, mounted at `app.use('/api/workspaces', workspaceRoutes)`. `/api/tasks` is gone — no shim, no deprecation period; this is a portfolio project; not a public API with consumers.
- [x] `scopeFilter(req)`, `canView`, `canManage`, `canWrite` in `src/services/authz.ts`, wired into every `task.controller.ts` and `comment.controller.ts` function. Deleted the duplicated `visibilityFilter` from `comment.controller.ts` — one definition of scope now, not two.
- [x] Every write path stamps `workspace: req.workspace._id` — `createTask`, `addComment`, and both `Activity` write sites (single `create` and the `insertMany` batches in `updateTask`/`bulkUpdateTasks`).
- [x] Judgment calls made while wiring this in, none explicitly spelled out in the original plan: `createTask` and `addComment` now reject `viewer`s outright (`canWrite`) — "viewer writes nothing" is a blanket statement, and creating new content is a write. `bulkUpdateTasks`' status-only path also gates on `canWrite` — the old code had no permission check at all on bulk status changes, which was arguably already a gap.
- [x] **Latent bug fixed:** `createTask`'s rank lookup (`task.controller.ts:142`) was `Task.findOne({ status })`, scanning the *entire collection* regardless of tenant. Now `Task.findOne({ workspace, status, deletedAt: null })`.
- [x] Smoke tests updated to the new nested shape (creating a workspace directly via the models, since workspace-creation endpoints don't exist yet). Verified live against the real dev database too, not just the test suite: real workspace access works, a non-existent slug 404s (not 403 — confirmed no existence leak), and no-cookie requests 401.

**Part B — not started:** `routes/workspace.routes.ts` gains workspace CRUD, `GET/PATCH/DELETE .../members/:userId`, invite create/list/revoke, plus top-level `POST /api/invites/:token/accept`. This is also where `listUsers` (`user.controller.ts:7-10`, returns every user in the database to any authenticated caller) gets replaced with `GET /api/workspaces/:slug/members` — paginated, `?q=` prefix search, co-members only.

- [x] **Migration — `src/scripts/migrate-001-workspaces.ts`** (`npm run migrate`). Idempotent, stamped in a `Migration` model (`{name, appliedAt}`, unique on `name`):
  1. Check stamp; exit if already applied.
  2. Upsert workspace `{ name: 'TaskForge', slug: 'taskforge', owner: <first admin, or first user if none> }`.
  3. `WorkspaceMember.bulkWrite` (upsert per user, not plain `insertMany`) — owner gets `owner`, other admins get `admin`, rest get `member`. Upsert rather than insert so a re-run after a partial failure can't hit the unique `{workspace,user}` index.
  4. `updateMany({ workspace: { $exists: false } }, ...)` on Task, Comment, Activity.
  5. **Verify:** count docs still missing `workspace`; exit **non-zero** if > 0.
  6. Write the stamp.

  Wired `preDeployCommand: npm run migrate` into `render.yaml`. Verified live against the real dev database, not just type-checked: first run created the workspace + 4 memberships and backfilled every existing Task/Comment/Activity; a second run correctly no-op'd against the existing stamp.

**Seed rewrite:** two workspaces — "Acme Product" (all four users, varied roles including one `viewer`) and "Side Project" (admin + jane only) — with the 50 tasks split across them and one pending invite. Two workspaces is what makes isolation demo-able in five seconds: log in as john and "Side Project" simply isn't there.

**Frontend**
- [ ] `App.tsx`: routes become `/w/:slug/*` under a new `WorkspaceLayout` that resolves the slug, 404s non-members, and provides context. `/` redirects to last-visited workspace (localStorage) else `/workspaces`.
- [ ] New: `context/WorkspaceContext.tsx`, `hooks/useWorkspaces.ts`, `hooks/useMembers.ts`, `pages/Workspaces.tsx`, `pages/settings/Members.tsx`, `pages/AcceptInvite.tsx`, `components/layout/WorkspaceSwitcher.tsx` (Popover + the existing `components/ui/command.tsx`), mounted in `Navbar.tsx`.
- [ ] **Every query key gains the slug**: `['ws', slug, 'tasks', ...]`. Fixes cross-workspace cache bleed and sets up Phase 3's targeted updates.
- [ ] `AuthContext.tsx`: `isAdmin` → `isPlatformAdmin`; component role checks move to `useWorkspaceRole()`.

**Demonstrates:** tenant isolation as a structural property; join-collection modeling with the alternatives explicitly rejected; per-tenant RBAC; an idempotent, self-verifying migration wired into the deploy; the judgment to break an API contract deliberately and document it.

---

## Phase 2 — Query performance, search, caching, hardening · **M–L**

Only possible now, because `workspace` is the leading equality key.

**Indexes — `models/Task.ts`** (drop the current singles and `{status:1, rank:1}`)
- [ ] `{ workspace:1, deletedAt:1, status:1, rank:1 }` — board columns (textbook Equality-Sort-Range ordering)
- [ ] `{ workspace:1, deletedAt:1, createdAt:-1 }` — default list sort
- [ ] `{ workspace:1, deletedAt:1, dueDate:1 }` — calendar + overdue count
- [ ] `{ workspace:1, assignedTo:1, deletedAt:1 }` — assignee filter
- [ ] `{ workspace:1, title:'text', description:'text' }`, weights `{title:10, description:1}`
- [ ] `Comment.ts` / `Activity.ts`: `{ task:1, createdAt:-1 }`

**The demo artifact — `src/scripts/bench-seed.ts` + `src/scripts/explain.ts`.** `bench-seed` generates 50k tasks across 5 workspaces; `explain` runs the five hot queries with `.explain('executionStats')` and prints stage / `totalDocsExamined` / `nReturned` / `executionTimeMillis`. Put the before/after table in the README: *"COLLSCAN, 48,000 docs examined, 210ms → IXSCAN, 20 examined, 2ms."* Cheap to build, and it turns "I added indexes" into a measured claim you can walk someone through.

**Search:** `listTasks` uses `$text` + optional `textScore` sort when `search.length >= 3`, regex below that. New `GET /api/workspaces/:slug/search?q=` running parallel `$text` over tasks and comments — this finally wires `CommandPalette.tsx` to a real server search instead of its current scan over ≤200 cached items.

**Pagination:** cursor-paginate `listComments` (`comment.controller.ts:21-26`, currently returns *all* comments with no limit) and `getTaskActivity` (hard `.limit(100)` with no way to reach older entries); paginate `listTrash`. Raise the `limit` max in `task.validator.ts:46` and **return `pagination.hasMore`** — `Board.tsx:30` and `Calendar.tsx:42` switch to `useInfiniteQuery` with a visible "500 of 1,240 — load more" affordance. Silent truncation is worse than a visible limit.

**Stats:** collapse the 3 parallel queries in `getTaskStats` (`task.controller.ts:105-137`) into **one `$facet` aggregation**, then cache it.

**Cache — `src/lib/cache.ts`** (interface + two drivers, per decision 3), applied in value order:
1. `ws:slug:<slug>` and `member:<wsId>:<userId>`, TTL 300s — the *new* per-request queries Phase 1 introduces. Caching these makes the tenancy refactor latency-neutral.
2. `user:<id>`, TTL 60s — kills the `User.findById` running on **every authenticated request** (`middleware/auth.ts:29`). Bust in `updateMe`/`changePassword`.
3. `stats:<wsId>`, TTL 30s, **write-through invalidation** on every task write so the dashboard is never visibly stale mid-demo.
4. Rate-limit counters.

Add an `X-Cache: HIT|MISS` response header — one line, and it makes caching visible in devtools while screen-sharing.

**Hardening**
- [ ] `express-rate-limit` + `rate-limit-redis`: global 300/15min per IP; login/register 10/15min per IP+email; writes 60/min per user. Brute force is currently unmitigated.
- [ ] **CSRF:** production cookie is `SameSite=None` (required for the cross-origin Render↔Vercel split) with **no token defense**. Add `csrf-csrf` (double-submit, stateless — `csurf` is deprecated): backend sets a non-HttpOnly `tf_csrf` cookie on login; the axios interceptor in `lib/api.ts` mirrors it into `X-CSRF-Token` on non-GET. ~40 lines, closes a hole a security-minded reviewer will probe.
- [ ] `auth.validator.ts`: password min 6 → 10 + a small common-password denylist.

**The full authz matrix test suite lands here** (per decision 5) — the model is now stable enough to pin down.

**Demonstrates:** ESR index design, explain-plan-driven optimization *with numbers*, a tenancy-aware partitioned text index, `$facet`, cache abstraction, layered rate limiting, and correct reasoning about cross-site cookies.

---

## Phase 3 — Real-time collaboration · **M–L**

The most demo-able phase — two browsers side by side.

**Backend:** `server.ts` switches to `http.createServer(app)` with socket.io attached. New `src/realtime/`: `io.ts` (server + handshake), `auth.ts` (parse `tf_token` from the handshake, reuse `verifyToken`), `events.ts` (typed contract), `emit.ts` — a **single seam**, so controllers call `emitTaskChanged(...)` and never `io.emit` inline.

Rooms `ws:<workspaceId>` and `task:<taskId>`, joined only after **re-checking membership server-side** — never trust a client-supplied room name. Events: `task:created|updated|deleted|restored`, `comment:created|deleted`, `member:joined|role_changed`, `presence:sync`, `typing`.

**Frontend:** `realtime/socket.ts` (singleton, connects on workspace mount, `withCredentials`), `hooks/useRealtime.ts`, and `realtime/applyTaskEvent.ts` — a **pure reducer**, which is exactly what Phase 0's harness unit-tests.

Cache integration, targeted over blanket:
- [ ] `task:updated` → walk `qc.getQueriesData(['ws', slug, 'tasks'])`, patch by `_id` in place; also `setQueryData(['ws', slug, 'task', id], task)`.
- [ ] `task:created|deleted` → `invalidateQueries` on the *list* key only (insertion position depends on server sort + active filters), plus stats.
- [ ] **Echo suppression:** server includes `originSocketId`; the client ignores events matching its own `socket.id`, so optimistic updates aren't double-applied.
- [ ] **On reconnect** → one full `invalidateQueries(['ws', slug])` resync plus a "Reconnecting…" chip in the navbar. Render's spin-down makes this visible, so handling it is a point in your favor rather than a wart.

**Collaboration riding on the transport:** `@mentions` in comments (`mentions: [userId]` on `Comment`); a `Notification` model + navbar bell with unread count; task **watchers** (`watchers: [userId]` on `Task`, auto-added on comment or assignment); optional email via **Resend** (`src/lib/mailer.ts`) for invites and mention digests, behind a `RESEND_API_KEY` guard that console-logs in dev.

**Demonstrates:** WebSocket *authentication* — the part most portfolio projects skip entirely — room fan-out respecting tenant boundaries, surgical cache updates, presence, reconnection semantics, and a named seam for horizontal scale.

---

## Phase 4 — Frontend performance · **M**

Independently shippable; produces a measurable before/after.

- [ ] **Code splitting:** `App.tsx:5-13` statically imports all 9 pages into one bundle. `React.lazy` behind `<Suspense>` using the existing `Skeleton`; keep Login/Register eager; preload on nav hover in `Navbar.tsx` to kill the perceived split cost.
- [ ] **`vite.config.ts`:** `manualChunks` — `vendor-react`, `vendor-data`, `vendor-dnd` (`@dnd-kit/*`, only `/board`), `vendor-date` (only `/calendar`), `vendor-ui`. Add `rollup-plugin-visualizer` behind `--mode analyze` and `vite-plugin-compression2` for brotli. Bundle table in the README.
- [ ] **Debounce:** new `hooks/useDebouncedValue.ts` (300ms) at `FilterBar.tsx:97-98` and `Board.tsx:52` — today *every keystroke* fires a request, and there is no debounce anywhere in the codebase. Add `placeholderData: keepPreviousData` so the table doesn't flash to skeleton per keystroke.
- [ ] **Memoization:** extract a memoized `TaskRow` from `TaskTable.tsx`; `React.memo` on `BoardCard.tsx` / `BoardColumn.tsx`. The real fix for `KanbanBoard.tsx:79-132` is holding drag placement in a `useRef` and calling `setColumns` only when the target column *or index actually changes* — with memoized cards, a drag re-renders 2 columns instead of 500 cards.
- [ ] **Virtualization:** `@tanstack/react-virtual` — its headless hooks API composes with dnd-kit's `useSortable`, where `react-window`'s component API fights it. Applied **only above ~100 items** so the common case doesn't regress.
- [ ] **Query keys:** new `lib/queryKeys.ts` factory; replace all 7 `invalidateQueries({ queryKey: ['tasks'] })` call sites in `hooks/useTasks.ts` with the narrowest node. Today one comment or one drag nukes every cached page *and* the stats.
- [ ] **`lib/queryClient.ts`:** `gcTime: 5min`, `refetchOnWindowFocus: false` with the comment *"websockets are the freshness mechanism now"*, and `retry: (n, err) => err.status >= 500 && n < 2`.

**Demonstrates:** bundle budgeting, render profiling, virtualization, the query-key factory pattern, a measured Lighthouse + bundle-size delta.

---

## Phase 5 — Ops, observability, reliability · **M**

Last because it's least visually demo-able — so give it visual hooks anyway.

- [ ] **Logging:** `pino` + `pino-http` replacing morgan (`app.ts:25`); `pino-pretty` in dev. Request id → `X-Request-Id`, propagated via `AsyncLocalStorage` so every log line in a request carries it. Redact `cookie` / `authorization`.
- [ ] **Errors:** `@sentry/node` + `@sentry/react`, source maps from CI, `tracesSampleRate: 0.1`, capturing 5xx only in `middleware/error.ts`. Add a frontend `ErrorBoundary` — currently absent, so an unhandled render error today shows a blank white page.
- [ ] **Metrics:** `prom-client` at a token-guarded `GET /metrics` — default Node metrics, an `http_request_duration_seconds` histogram, `taskforge_cache_hits_total`, `taskforge_ws_connections`. **Demo hook:** `docker-compose.observability.yml` with Prometheus + Grafana and a checked-in dashboard JSON, so you can run it locally and screenshot it for the README.
- [ ] **Retention:** TTL on `Notification.createdAt` (30d); `scripts/purge-trash.ts` hard-deleting tasks with `deletedAt < 30d` plus their Activity/Comment, as a Render cron service. Closes the unbounded-growth gap.
- [ ] **Containers:** `taskforge-backend/Dockerfile` (multi-stage → `node:22-alpine`, non-root, `HEALTHCHECK`, `dumb-init` for signal forwarding) + root `docker-compose.yml` (api + mongo + redis). `docker compose up` and the whole thing runs — a large reviewer-experience win for the cost.
- [ ] **CI hardening:** `e2e.yml` running Playwright against compose with trace artifacts; `codeql.yml`; Dependabot; coverage badge.
- [ ] **Backups:** documented `mongodump` script — Atlas M0 has no automated backups, and saying so shows you know your platform's limits.

---

## Sequencing & cut points

| Phase | Size | Why here |
|---|---|---|
| 0 — Credibility floor + CI | S–M | Nothing downstream is verifiable without it |
| 1 — Workspaces | L | **Must precede indexes** — `workspace` is the leading key they all need |
| 2 — Performance, search, cache | M–L | Unblocked by Phase 1; authz matrix tests land here |
| 3 — Real-time | M–L | Needs Phase 1's room model |
| 4 — Frontend perf | M | Easier after Phase 1 introduces `['ws', slug, …]` keys |
| 5 — Ops | M | Depends on nothing; can slide |

**If time compresses: Phase 0 + 1 + 2 is the defensible minimum** — tenancy, measured index work, and a real cache is already a stronger story than most portfolio projects. Phase 3's presence feature is the highest *visual* return per hour if you can add only one more. Phase 5's Docker + compose is the cheapest single item relative to reviewer goodwill.

---

## Verification

**Every phase:** `.github/workflows/ci.yml` must stay green — backend (`lint` → `build` → `test`) and frontend (`lint` → `build`).

**Phase 1 — the isolation test is the deliverable:**
1. `npm run seed` → two workspaces with overlapping membership.
2. Log in as a member of Acme only; confirm zero Side Project tasks in list, board, calendar, search, stats, trash, **and command palette**.
3. `GET /api/workspaces/acme/tasks/<sideProjectTaskId>` → **404**, not 403.
4. Request a workspace slug the caller isn't a member of → 404 from `resolveWorkspace`.
5. Run the migration against a pre-migration dump; assert zero unscoped Task/Activity/Comment docs remain; **run it twice** and confirm the second run is a no-op.
6. Confirm a `viewer` cannot mutate anything and a `member` can patch only `status`/`rank` on tasks they didn't create.

**Phase 2:** `npm run bench:seed && npm run explain` — capture the before/after table. An index change without a before/after number is an assertion, not a result. Then confirm 429 after N failed logins, and `X-Cache: HIT` on a second dashboard load.

**Phase 3:** two browsers, same workspace, side by side — drag a card in one, watch it move in the other with no refetch. Then a third browser in a *different* workspace must see nothing. Kill the network to confirm the reconnect path resyncs.

**Phase 4:** Lighthouse + `npm run build -- --mode analyze` before and after; React DevTools profiler on a board drag to confirm the re-render count drops.

**Throughout:** keep `docs/PLAN.md` current — it is the stated source of truth. Phase 0 brought it back in sync with the code; don't let it drift again.
