# TaskForge

A full-stack task management app with workspace-based multi-tenancy. Each workspace has its own tasks and members, with roles (owner/admin/member/viewer) controlling access.

> The frontend hasn't been updated to expose workspaces yet — see `docs/SCALING.md` Phase 1. The API below is current; the UI still calls the pre-workspace routes and won't work end-to-end until that lands.

**Stack:** React + Vite + TypeScript · Express 5 + TypeScript · MongoDB Atlas · shadcn/ui + Tailwind · TanStack Query · JWT (HttpOnly cookie)

---

## Features

- **Auth** — register (auto-login), login, logout; JWT stored in an HttpOnly cookie — never exposed to JavaScript
- **Workspace-scoped access** — every task, comment, and activity record belongs to a workspace; only active members see it, and role (owner/admin/member/viewer) controls what they can do (enforced at the API, not just the UI)
- **Task CRUD** — create, view, edit, delete with title, description, priority, status, due date, and assignee
- **Status workflow** — Open → In Progress → Testing → Done
- **Assignee-only edit** — assigned users can update status only; full edit requires creator or admin
- **Task list** — table/card view toggle, search by title, filter by status/priority/assignee, sortable columns
- **Kanban board** — drag-and-drop across status columns with live card preview; drag to reorder within a column; fractional-index ranking (one write per move, no cascading updates)
- **Activity log** — every status change, reassignment, and edit is recorded with actor and timestamp; timeline shown on task detail
- **Comments** — per-task threaded comments; author and admin can delete; Ctrl/⌘+Enter to submit
- **Dashboard** — stats cards (total, overdue, counts by status and priority); clickable cards pre-apply filters; completion progress bar
- **Profile** — view account details, edit name/email, change password
- **Dark mode** — toggle in navbar, persists across sessions
- **Toasts** — success and error feedback on all mutations
- **Skeleton loading states** and empty/error states throughout

---

## Project structure

```
taskforge-backend/    Express 5 + TypeScript REST API
taskforge-frontend/   React + Vite SPA
```

---

## Setup

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free M0 tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd TaskForge

cd taskforge-backend && npm install
cd ../taskforge-frontend && npm install
```

### 2. Configure the backend

```bash
cd taskforge-backend
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Variable         | Required | Description |
|-----------------|----------|-------------|
| `MONGODB_URI`   | Yes      | MongoDB Atlas connection string |
| `JWT_SECRET`    | Yes      | Long random string for signing tokens |
| `PORT`          | No       | API port (default `3000`) |
| `CLIENT_ORIGIN` | No       | Frontend origin for CORS (default `http://localhost:5173`) |
| `JWT_EXPIRES_IN`| No       | Token lifetime (default `7d`) |

### 3. Configure the frontend

```bash
cd taskforge-frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3000
```

---

## Running locally

Open two terminals:

```bash
# Terminal 1 — API
cd taskforge-backend
npm run dev
```

```bash
# Terminal 2 — Frontend
cd taskforge-frontend
npm run dev
```

Frontend: http://localhost:5173
API: http://localhost:3000

---

## Database

### Seed demo data

Populates 4 users and 50 sample tasks across all status columns with activity logs (clears existing data first):

```bash
cd taskforge-backend
npm run seed
```

### Reset collections

```bash
# Clear everything
npm run reset:db -- all

# Clear specific collections
npm run reset:db -- User Task Activity Comment
```

### Demo credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@taskforge.com` | `admin123` | Admin |
| `jane@taskforge.com`  | `user1234` | User  |
| `john@taskforge.com`  | `user1234` | User  |
| `sarah@taskforge.com` | `user1234` | User  |

---

## Build

```bash
# Backend — type-check + compile to dist/
cd taskforge-backend && npm run build

# Frontend — type-check + bundle to dist/
cd taskforge-frontend && npm run build
```

---

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Liveness check, no DB dependency |
| GET | `/api/health/ready` | — | Readiness check, pings MongoDB |
| POST | `/api/auth/register` | — | Create account, set auth cookie |
| POST | `/api/auth/login` | — | Login, set auth cookie |
| POST | `/api/auth/logout` | Cookie | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Current user |
| PATCH | `/api/users/me` | Cookie | Update profile |
| PATCH | `/api/users/me/password` | Cookie | Change password |
| GET | `/api/workspaces` | Cookie | List workspaces the caller belongs to |
| POST | `/api/workspaces` | Cookie | Create a workspace (caller becomes owner) |
| GET | `/api/workspaces/:slug` | Cookie | Workspace details |
| GET | `/api/workspaces/:slug/members` | Cookie | List members |
| POST | `/api/workspaces/:slug/invites` | Cookie, owner/admin | Invite a member by email |
| POST | `/api/invites/:token/accept` | Cookie | Accept an invite |
| GET | `/api/workspaces/:slug/tasks` | Cookie | List tasks in the workspace |
| POST | `/api/workspaces/:slug/tasks` | Cookie | Create a task |
| GET | `/api/workspaces/:slug/tasks/:id` | Cookie | Task detail |
| PATCH | `/api/workspaces/:slug/tasks/:id` | Cookie | Update task (status/rank for `member`; all fields for creator/owner/admin) |
| DELETE | `/api/workspaces/:slug/tasks/:id` | Cookie | Delete task (creator, owner, or admin only) |
| GET | `/api/workspaces/:slug/tasks/:id/comments` | Cookie | List comments |
| POST | `/api/workspaces/:slug/tasks/:id/comments` | Cookie | Add a comment |

Not exhaustive — bulk update/delete, trash, restore, and activity endpoints exist too. Non-members get `404` (not `403`) for workspaces they're not in, same for tasks outside their workspace — existence is never leaked.
