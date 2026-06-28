# TaskForge

A full-stack task management app with role-based access control. Admins see and manage all tasks; regular users see only tasks they created or are assigned to.

**Stack:** React + Vite + TypeScript · Express 5 + TypeScript · MongoDB Atlas · shadcn/ui + Tailwind · TanStack Query · JWT auth

---

## Features

- **Auth** — register, login, JWT sessions persisted across refresh
- **Role-based access** — admin sees everything; users see only their tasks (enforced on the API, not just the UI)
- **Task CRUD** — create, view, edit, delete with title, description, priority, status, due date, assignee
- **Status workflow** — Open → In Progress → Testing → Done
- **Assignee-only edit** — assigned users can update status only; full edit requires creator or admin
- **Task list** — table/card view toggle, search by title, filter by status/priority/assignee, sortable columns
- **Kanban board** — drag-and-drop across status columns with live card preview; drag to reorder within a column; fractional-index ranking (one write per move, no cascading updates)
- **Dashboard** — stats cards: total, overdue, counts by status and priority; clickable cards pre-apply filters
- **Profile** — view account details, edit name/email, change password
- **Dark mode** — toggle in navbar, persists to `localStorage`
- **Toasts** — success and error feedback on all mutations
- **Skeleton loading states** and empty/error states throughout

---

## Project structure

```
taskforge-backend/    Express 5 + TypeScript REST API
taskforge-frontend/   React + Vite SPA
docs/PLAN.md          Authoritative build plan and feature log
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
cp .env.example .env   # or create .env manually
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

Clear specific collections or the entire database:

```bash
# Reset all collections
npm run reset:db -- all

# Reset specific collections
npm run reset:db -- User Task Activity
npm run reset:db -- Task
```

### Demo credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@taskforge.com` | `admin123` | Admin |
| `jane@taskforge.com`  | `user1234` | User  |
| `john@taskforge.com`  | `user1234` | User  |
| `sarah@taskforge.com` | `user1234` | User  |

The admin account sees all tasks and can assign tasks to any user. Regular user accounts see only tasks they created or were assigned to.

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
| POST | `/api/auth/register` | — | Create account, returns JWT |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/users` | Bearer | List users (for assign dropdown) |
| GET | `/api/tasks` | Bearer | List tasks (role-scoped) |
| GET | `/api/tasks/stats` | Bearer | Dashboard stats |
| POST | `/api/tasks` | Bearer | Create task |
| GET | `/api/tasks/:id` | Bearer | Task detail |
| PATCH | `/api/tasks/:id` | Bearer | Update task (status + rank for assignees; all fields for creator/admin) |
| DELETE | `/api/tasks/:id` | Bearer | Delete task (creator or admin only) |

Non-admins receive `404` (not `403`) for tasks they don't own — existence is not leaked.
