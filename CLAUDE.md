# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TaskForge is a full-stack task management / team workflow app. Monorepo with two packages:

- `taskforge-backend/` — Express 5 + TypeScript REST API on MongoDB (Mongoose)
- `taskforge-frontend/` — React + Vite + TypeScript SPA (shadcn/ui + Tailwind)

`docs/PLAN.md` is the feature registry and source of truth for scope, data model, and remaining work — read it before making changes.

---

## graphify

This project has a knowledge graph at `graphify-out/`. **Before using Read, Grep, or Glob to explore the codebase, always query the graph first** — it returns a scoped subgraph in one shot, faster and less context-heavy than manual exploration.

```bash
graphify query "<question>"        # primary: investigate any feature or bug
graphify path "<A>" "<B>"          # trace a relationship between two symbols/files
graphify explain "<concept>"       # focused deep-dive on a specific concept
graphify update .                  # keep graph current after modifying code (AST-only, no API cost)
```

If `graphify-out/wiki/index.md` exists, use it for broad navigation. Read `graphify-out/GRAPH_REPORT.md` only for architecture review when query/path/explain aren't enough.

---

## Commands

### Backend (`taskforge-backend/`)

```bash
npm run dev          # start API with hot reload (tsx watch on src/server.ts)
npm run build        # type-check + compile to dist/ (tsc)
npm start            # run compiled server (node dist/server.js)
npm run seed         # seed 4 users + 50 sample tasks with activity logs (clears existing data)
npm run reset:db -- all              # delete all collections
npm run reset:db -- User Task        # delete specific collections
```

No test runner is configured. `npm run build` is the only static check — run it before considering backend work done.

### Frontend (`taskforge-frontend/`)

```bash
npm run dev          # start Vite dev server (http://localhost:5173)
npm run build        # type-check + bundle to dist/
npm run preview      # preview the production build locally
```

The server requires a `.env` (copy from `.env.example`). `MONGODB_URI` and `JWT_SECRET` are **required** — `config/env.ts` throws on startup if either is missing.

---

## Backend architecture

TypeScript compiles as **CommonJS** (`tsconfig.json`), so relative imports are extensionless. Request flow:

```
routes → validate(zod) → authenticate → requireRole? → controller → model → error handler
```

Key conventions:

- **Errors**: throw `ApiError` (`utils/ApiError.ts`) with static helpers (`ApiError.notFound()`, `.forbidden()`, etc.). Never `res.status().json()` an error directly. The central `errorHandler` (`middleware/error.ts`) converts `ApiError`, Mongoose duplicate-key (11000), and Zod issues to `{ message }` JSON.
- **Async**: wrap every async controller/middleware in `asyncHandler` (`utils/asyncHandler.ts`) so rejections reach the error handler.
- **Auth**: `authenticate` (`middleware/auth.ts`) reads the JWT from the `tf_token` HttpOnly cookie (falls back to `Authorization: Bearer` header), loads the user, and sets `req.user`. `requireRole('admin', ...)` gates by role. JWT payload is `{ sub, role }` (`utils/jwt.ts`).
- **Validation**: `validate({ body, query, params })` (`middleware/validate.ts`) runs Zod schemas from `validators/`. Express 5 makes `req.query` read-only, so validated query lands on **`req.validatedQuery`** (cast it in the controller) — body and params are reassigned in place.
- **Serialization**: never return raw user docs. `passwordHash` has `select: false` on the schema; use `publicUser()` (`utils/serialize.ts`) to shape user output. `publicUser()` returns `_id` (not `id`) — use `_id` consistently everywhere.

### Role-based visibility

Authorization lives in `controllers/task.controller.ts`, not middleware, because it depends on task ownership:

- `visibilityFilter(user)` — Mongoose filter: `{}` for admins, `{ $or: [{ createdBy }, { assignedTo }] }` for users. Reuse for every list/aggregate.
- `canView` (admin / creator / assignee), `canManage` (admin / creator). An assignee may only change `status` and `rank`; delete requires `canManage`. Out-of-scope access returns **404** (not 403).

---

## Data model

**User**: `name`, `email` (unique, lowercased), `passwordHash`, `role: admin|user`, timestamps.

**Task**: `title`, `description`, `priority: low|medium|high`, `status: open|in_progress|testing|done`, `dueDate`, `rank` (fractional-index string for Kanban ordering), `createdBy→User`, `assignedTo→User|null`, timestamps. `TASK_STATUSES` and `TASK_PRIORITIES` are exported from `models/Task.ts` — reuse in Zod enums.

**Activity**: append-only; `task`, `actor`, `actorName`, `type: created|status_changed|assigned|unassigned|edited`, `from`, `to`, timestamps.

**Comment**: `task`, `author`, `authorName`, `body` (max 5000 chars), timestamps.

---

## Frontend architecture

React 18 + Vite + TypeScript SPA. Key conventions:

- **API client**: `lib/api.ts` — Axios instance with `withCredentials: true` so the browser sends `tf_token` automatically. No `Authorization` header — the token never touches JavaScript. Response interceptor removes `tf_user` from localStorage and redirects to `/login` on 401.
- **Auth**: Cookie-based. The JWT lives in an HttpOnly cookie set by the backend on login/register. `context/AuthContext.tsx` holds only the `user` object (persisted to `localStorage` as `tf_user` for fast initial render — no token in JS state). `login(user)` sets the user; `logout()` calls `POST /api/auth/logout` to clear the server cookie, then removes `tf_user`. Register auto-logs the user in and navigates to `/`.
- **Data fetching**: TanStack Query (`lib/queryClient.ts`). All server state lives in query hooks (`hooks/useTasks.ts`, `hooks/useComments.ts`). Mutations call `queryClient.invalidateQueries` on success.
- **Forms**: React Hook Form + Zod resolvers. Shared schemas in `lib/schemas.ts`.
- **Routing**: React Router v6. Routes: `/login`, `/register`, `/` (dashboard), `/tasks` (list), `/tasks/:id` (detail), `/profile`, `/board` (kanban).

### Role-aware UI rules

- Admin sees all tasks including an assignee column; role label shown in navbar.
- Regular users see only tasks they created or are assigned to (enforced by the API; the frontend renders what it receives).
- Edit dialog shows all fields to admins/creators; assignees see only the status dropdown.

### Environment variable

`VITE_API_URL` in `taskforge-frontend/.env` — the base URL for the Axios instance (e.g. `http://localhost:4000`). Must be set before running the dev server.
