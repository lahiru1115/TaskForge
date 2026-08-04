# TaskForge — Deployment

**Architecture:**

| Layer | Platform | Notes |
|-------|----------|-------|
| Backend | Render — Web Service | Node, built from `taskforge-backend/` |
| Frontend | Vercel | Static SPA built from `taskforge-frontend/` |
| Database | MongoDB Atlas | Free M0 tier is sufficient |

Repo: `https://github.com/lahiru1115/TaskForge`

> Placeholders below are written as `<your-service>.onrender.com` and `<your-app>.vercel.app`. Substitute the real hostnames from your dashboards — they are not stored in the repo.

---

## Why this split needs care

Frontend and backend sit on **different origins**, and auth is a cookie. Three settings have to agree or login silently fails in production while working perfectly on localhost:

1. **`taskforge-backend/src/controllers/auth.controller.ts`** sets the cookie with `secure: isProd` and `sameSite: isProd ? 'none' : 'strict'`. `SameSite=None` is mandatory for a cross-site cookie, and browsers reject `SameSite=None` unless `Secure` is also set — which is why both are keyed to `NODE_ENV`. **If `NODE_ENV` is not `production` on Render, the cookie is issued as `SameSite=Strict` and the browser will drop it.**
2. **`taskforge-backend/src/app.ts:19-24`** — CORS runs with `origin: env.clientOrigins` and `credentials: true`. The Vercel origin must be in that list exactly, scheme included, no trailing slash.
3. **`taskforge-backend/src/app.ts:16`** — `app.set('trust proxy', 1)`, required behind Render's proxy so `secure` cookies and `req.ip` behave.

`CLIENT_ORIGIN` is comma-split in `taskforge-backend/src/config/env.ts:15-18`, so multiple origins are supported.

---

## Phase 1 — MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → create a user; note the password.
3. **Network Access** → Render does not publish stable egress IPs on the free tier, so allow `0.0.0.0/0`. The database user credential is the actual access control here.
4. Copy the `mongodb+srv://...` connection string; append the database name (e.g. `/taskforge`) before the `?`.

> M0 has **no automated backups**. See "Backups" below.

---

## Phase 2 — Backend on Render

**New → Web Service → connect the GitHub repo.**

| Setting | Value |
|---------|-------|
| Root Directory | `taskforge-backend` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free (or Starter — see caveat) |

`npm run build` runs `tsc` → `dist/`; `npm start` runs `node dist/server.js`. Both are already defined in `taskforge-backend/package.json`.

### Environment variables

Set these in Render → **Environment**:

| Variable | Required | Value |
|----------|----------|-------|
| `NODE_ENV` | **Yes** | `production` — see "Why this split needs care" above; getting this wrong breaks login |
| `MONGODB_URI` | **Yes** | Atlas connection string. `config/env.ts` throws on startup if absent |
| `JWT_SECRET` | **Yes** | Long random string. `config/env.ts` throws on startup if absent |
| `CLIENT_ORIGIN` | **Yes in practice** | `https://<your-app>.vercel.app`. Defaults to `http://localhost:5173`, which will not work in production |
| `PORT` | No | Render injects this; the app reads it at `config/env.ts:13` |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Free-tier caveat

Render's free tier **spins the instance down after ~15 minutes of inactivity**. The next request pays a cold start of roughly 30–60 seconds, which during a demo looks like a hung login. Options: upgrade to Starter, or warm it with an external uptime pinger before showing it to anyone.

### Health check

Set the health check path to `/api/health` (already wired in `render.yaml`). `GET /api/health` is a liveness check with no DB dependency; `GET /api/health/ready` additionally pings MongoDB — Render itself only uses the former.

---

## Phase 3 — Frontend on Vercel

**Add New → Project → import the repo.**

| Setting | Value |
|---------|-------|
| Root Directory | `taskforge-frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Environment variable

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://<your-service>.onrender.com` — no trailing slash |

This is baked in at **build time**, not read at runtime. Changing it requires a redeploy, not just a restart.

> If `VITE_API_URL` is unset, the app falls back to `http://localhost:3000` (`taskforge-frontend/src/lib/api.ts:4`) — fine for local dev, wrong in production. Verify the variable is set on every deployed environment.

### SPA routing — required

Without a rewrite, a hard refresh on `/tasks/:id` or `/board` returns a Vercel 404, because those paths only exist inside React Router. Add `taskforge-frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Phase 4 — Wire the two together

Deployment is circular — each side needs the other's URL — so it takes two passes:

1. Deploy the backend; copy the Render URL.
2. Set `VITE_API_URL` on Vercel to that URL; deploy the frontend; copy the Vercel URL.
3. Set `CLIENT_ORIGIN` on Render to the Vercel URL. Render restarts automatically.

### Preview deployments

Vercel gives every branch and PR its own hostname (`taskforge-git-<branch>-<scope>.vercel.app`). Because `CLIENT_ORIGIN` is an exact-match list, **preview deploys fail CORS by default**. Either add specific preview origins to the comma-separated list, or accept that only production is functional and test branches locally.

---

## Phase 5 — Seed demo data

`npm run seed` **clears existing data first** (4 users, 50 tasks). Run it deliberately, never against data you care about.

Run it locally with `MONGODB_URI` temporarily pointed at the Atlas cluster:

```bash
cd taskforge-backend
MONGODB_URI="<atlas-uri>" npm run seed
```

Then change it back. Demo credentials are listed in the root `README.md`.

> The seeded accounts use weak passwords (`admin123`) and are public in the README. That is fine for a portfolio demo and unacceptable for anything else.

---

## Verification

| Check | Expected |
|-------|----------|
| `GET https://<service>.onrender.com/api/auth/me` in a browser | `{"message":"Not authenticated"}` with **401** — proves the app booted and reached Mongo, not a 502 |
| Load the Vercel URL | Login page renders, no console errors |
| Log in with demo credentials | Dashboard loads with tasks |
| DevTools → Application → Cookies | `tf_token` present, **HttpOnly ✓, Secure ✓, SameSite=None** |
| DevTools → Network on login | No CORS error; response carries `Access-Control-Allow-Credentials: true` |
| Hard-refresh on `/tasks` | Page loads (not a Vercel 404) — confirms the rewrite |
| Log out | `tf_token` cleared; a refresh redirects to `/login` |
| Render logs | No `Missing required environment variable` on boot |

**If login appears to succeed but every subsequent request 401s**, the cookie was issued but not stored. In order of likelihood: `NODE_ENV` isn't `production` on Render (so `SameSite=Strict` was sent), or `CLIENT_ORIGIN` doesn't exactly match the Vercel origin.

---

## Known gaps

Tracked in [`SCALING.md`](./SCALING.md):

- **No CSRF defense** — a necessary consequence of `SameSite=None`, currently unmitigated (Phase 2).
- **No `engines.node` pin** in either `package.json`; Render picks its own default. Pin it to keep local and production on one major version.
- **No Atlas backups on M0** — take a manual `mongodump` before any migration.
