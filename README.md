# TaskForge

A full-stack task management app with role-based access control. Admins see and manage all tasks; regular users see only tasks they created or are assigned to.

**Stack:** React + Vite + TypeScript · Express 5 + TypeScript · MongoDB Atlas · shadcn/ui + Tailwind · TanStack Query · JWT (HttpOnly cookie)

---

## Features

- **Auth** — register (auto-login), login, logout; JWT stored in an HttpOnly cookie — never exposed to JavaScript
- **Role-based access** — admin sees all tasks; users see only their tasks (enforced at the API, not just the UI)
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
docs/PLAN.md          Feature registry and remaining work
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
| `PORT`          | No       | API port (default `4000`) |
| `CLIENT_ORIGIN` | No       | Frontend origin for CORS (default `http://localhost:5173`) |
| `JWT_EXPIRES_IN`| No       | Token lifetime (default `7d`) |

### 3. Configure the frontend

```bash
cd taskforge-frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:4000
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
API: http://localhost:4000

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
| POST | `/api/auth/register` | — | Create account, set auth cookie |
| POST | `/api/auth/login` | — | Login, set auth cookie |
| POST | `/api/auth/logout` | Cookie | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Current user |
| GET | `/api/users` | Cookie | List users (for assign dropdown) |
| GET | `/api/tasks` | Cookie | List tasks (role-scoped) |
| GET | `/api/tasks/stats` | Cookie | Dashboard stats |
| POST | `/api/tasks` | Cookie | Create task |
| GET | `/api/tasks/:id` | Cookie | Task detail |
| PATCH | `/api/tasks/:id` | Cookie | Update task (status + rank for assignees; all fields for creator/admin) |
| DELETE | `/api/tasks/:id` | Cookie | Delete task (creator or admin only) |
| GET | `/api/tasks/:id/comments` | Cookie | List comments for a task |
| POST | `/api/tasks/:id/comments` | Cookie | Add a comment |
| DELETE | `/api/tasks/:id/comments/:commentId` | Cookie | Delete a comment (author or admin only) |

Non-admins receive `404` (not `403`) for tasks they don't own — existence is not leaked.
