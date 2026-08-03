# TaskForge — Feature Registry

## Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 18 + Vite + TypeScript · Tailwind + shadcn/ui · React Router v6 · TanStack Query · React Hook Form + Zod · Axios |
| Backend  | Node + Express 5 + TypeScript · Mongoose · JWT (jsonwebtoken) · bcrypt · Zod · helmet · cors · morgan · cookie-parser |
| Database | MongoDB Atlas |

---

## Data Model

**User** — `name`, `email` (unique, lowercased), `passwordHash`, `role: admin|user`, timestamps

**Task** — `title`, `description`, `priority: low|medium|high`, `status: open|in_progress|testing|done`, `dueDate`, `rank` (fractional-index string for Kanban ordering), `createdBy→User`, `assignedTo→User|null`, timestamps

**Activity** — `task→Task`, `actor→User`, `actorName`, `type: created|status_changed|assigned|unassigned|edited`, `from`, `to`, timestamps

**Comment** — `task→Task`, `author→User`, `authorName`, `body` (max 5000 chars), timestamps

---

## Authorization

Role rules live in `controllers/task.controller.ts`:

- `visibilityFilter(user)` — Mongoose filter: `{}` for admins; `{ $or: [{ createdBy }, { assignedTo }] }` for regular users. Applied on every list/aggregate.
- `canManage` = admin or creator. `canView` = admin, creator, or assignee.
- Assignees may only change `status` and `rank` on update; all other fields require `canManage`.
- Out-of-scope tasks return **404** (not 403) — existence is never leaked.

---

## Features

### Phase 1 — Core
- [x] Auth: register, login, logout; JWT stored in an `HttpOnly; SameSite=Strict` cookie (`tf_token`); `GET /api/auth/me`; register auto-logs the user in
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
- [ ] Bulk actions: checkbox-select rows in task table → change status/assignee/delete for multiple tasks at once (one batched optimistic update with rollback)
- [ ] Command palette (⌘K): fuzzy-search tasks and jump to actions; client-side over TanStack Query cache; shadcn `Command` component

### Deployment
- [ ] Backend → Render
- [ ] Frontend → Vercel
- [ ] Fix `taskforge-frontend/.env.example` port (3000 → 4000)
- [ ] Make GitHub repo public
