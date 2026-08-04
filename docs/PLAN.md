# TaskForge — Feature Registry

## Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 19 + Vite + TypeScript · Tailwind + shadcn/ui · React Router v7 · TanStack Query · React Hook Form + Zod · Axios |
| Backend  | Node + Express 5 + TypeScript · Mongoose · JWT (jsonwebtoken) · bcrypt · Zod · helmet · cors · morgan · cookie-parser |
| Database | MongoDB Atlas |

---

## Data Model

**User** — `name`, `email` (unique, lowercased), `passwordHash`, `role: admin|user` (platform-level only — see Authorization), timestamps

**Workspace** — `name`, `slug` (unique), `owner→User`, timestamps

**WorkspaceMember** — `workspace→Workspace`, `user→User`, `role: owner|admin|member|viewer`, `status: active|invited`, unique on `(workspace, user)`, timestamps

**Invite** — `workspace→Workspace`, `email`, `role`, `tokenHash` (SHA-256, raw token never stored), `invitedBy→User`, `expiresAt`, `acceptedAt`, timestamps

**Task** — `title`, `description`, `priority: low|medium|high`, `status: open|in_progress|testing|done`, `dueDate`, `rank` (fractional-index string for Kanban ordering), `createdBy→User`, `assignedTo→User|null`, `workspace→Workspace`, timestamps

**Activity** — `task→Task`, `actor→User`, `actorName`, `type: created|status_changed|priority_changed|assigned|unassigned|edited`, `from`, `to`, `workspace→Workspace`, timestamps

**Comment** — `task→Task`, `author→User`, `authorName`, `body` (max 5000 chars), `workspace→Workspace`, timestamps

---

## Authorization

Workspace-scoped. Role rules live in `services/authz.ts`, applied once `middleware/workspace.ts` has resolved `req.workspace`/`req.membership`:

- `scopeFilter(req)` — every list/aggregate query is `{ workspace: req.workspace._id, deletedAt: null }`. Any active member sees everything in their workspace, regardless of role.
- `canManage` = workspace owner/admin, or the task's creator. `canView` = task belongs to the resolved workspace. `canWrite` = any role except `viewer`.
- Non-creators without manage rights may only change `status`/`rank`; `viewer`s can't write at all.
- Non-member workspace access and out-of-scope tasks both return **404** (not 403) — existence is never leaked.

See `docs/SCALING.md` Phase 1 for the workspace/membership/invite model this replaced (frontend not yet updated to expose it).

---

## Features

### Phase 1 — Core
- [x] Auth: register, login, logout; JWT stored in an `HttpOnly` cookie (`tf_token`, `SameSite=Strict` in dev, `SameSite=None; Secure` in production for the cross-site Render↔Vercel split); `GET /api/auth/me`; register auto-logs the user in
- [x] Role-based visibility: admin sees all tasks; regular users see only tasks they created or are assigned to (enforced at the API, not just the UI)
- [x] Task CRUD: create, view, edit, delete (title, description, priority, status, due date, assignee)
- [x] Status workflow: Open → In Progress → Testing → Done
- [x] Assignee-only edit: assignees may change status/rank only; full edit requires creator or admin
- [x] Task list: table/card view toggle, search by title, filter by status/priority/assignee, sortable columns
- [x] Dashboard: stats cards (total, overdue, counts by status and priority); clickable cards pre-apply filters on `/tasks`; completion progress bar
- [x] Profile: view account details, edit name/email, change password

### Phase 2 — Polish
- [x] Dark mode: toggle in navbar, persists to `localStorage`, no flash on load
- [x] Toasts: success and error feedback on all mutations
- [x] Skeleton loading states and empty/error states throughout
- [x] Login/register: split-panel branded layout with gradient and feature highlights
- [x] Navbar active-link context: task detail highlights Tasks or Board based on navigation origin (`location.state.from`)

### Phase 3 — Advanced
- [x] Kanban board (`/board`): drag-and-drop task status across 4 columns; per-column scroll; supports up to 500 tasks
- [x] Manual card ordering: drag to reorder within/across columns; fractional-indexing `rank` field; single O(1) write per move; live drag preview (`@dnd-kit/sortable` multi-container pattern)
- [x] Activity log: append-only `Activity` collection records status changes, reassignments, and edits (actor, type, from/to, timestamp); timeline rendered on task detail
- [x] Comments: per-task `Comment` collection (not subdocument); author and admin can delete; rendered below activity on task detail; Ctrl/⌘+Enter to submit

### Phase 4 — Remaining
- [x] Undo via toast: 5-second undo after delete/status drag using soft-delete (`deletedAt`)
- [x] Trash page (`/trash`): admin/creator can restore or permanently delete soft-deleted tasks
- [x] Bulk actions: checkbox-select rows in task table → change status/assignee/delete for multiple tasks at once (one batched optimistic update with rollback)
- [x] Command palette (⌘K): fuzzy-search tasks and jump to actions; client-side over TanStack Query cache; shadcn `Command` component

### Deployment
- [x] Backend → Render
- [x] Frontend → Vercel
- [x] Standardize on port `3000` everywhere (backend default, `.env.example` files, Axios fallback in `src/lib/api.ts:4`)
- [x] Make GitHub repo public
