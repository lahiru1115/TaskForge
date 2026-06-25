# TaskForge

A full-stack task management app with role-based access control. Admins see and manage all tasks; regular users see only tasks they created or are assigned to.

**Stack:** React + Vite + TypeScript · Express 5 + TypeScript · MongoDB (Atlas) · shadcn/ui + Tailwind · TanStack Query · JWT auth

---

## Features

- **Auth** — register, login, JWT sessions persisted across refresh
- **Role-based access** — admin sees everything; users see only their tasks (enforced on the API, not just the UI)
- **Task CRUD** — create, view, edit, delete with title, description, priority, status, due date, assignee
- **Status workflow** — Open → In Progress → Testing → Done
- **Assignee-only edit** — assigned users can update status; full edit requires creator or admin
- **Task list** — table/card view toggle, search by title, filter by status/priority/assignee, sortable
- **Dashboard** — stats cards: total, overdue, counts by status and priority
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

| Variable        | Required | Description |
|----------------|----------|-------------|
| `MONGODB_URI`  | Yes      | MongoDB Atlas connection string |
| `JWT_SECRET`   | Yes      | Long random string for signing tokens |
| `PORT`         | No       | API port (default `4000`) |
| `CLIENT_ORIGIN`| No       | Frontend origin for CORS (default `http://localhost:5173`) |
| `JWT_EXPIRES_IN`| No      | Token lifetime (default `7d`) |

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

## Seed demo data

Populates two users and five sample tasks (clears existing data first):

```bash
cd taskforge-backend
npm run seed
```

### Demo credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@taskforge.dev` | `admin123` | Admin |
| `jane@taskforge.dev`  | `user1234` | User  |

The admin account sees all tasks and can assign tasks to other users. Jane's account sees only the tasks she created or was assigned to.

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
| PATCH | `/api/tasks/:id` | Bearer | Update task |
| DELETE | `/api/tasks/:id` | Bearer | Delete task |

Non-admins receive `404` (not `403`) for tasks they don't own — existence is not leaked.
