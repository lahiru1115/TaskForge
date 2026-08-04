# TaskForge — Architecture

System topology and request flow. For data model and feature scope see [`PLAN.md`](./PLAN.md); for deploy config see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## System

```mermaid
flowchart LR
    Browser["Browser (React SPA)"] -- "HTTPS + tf_token cookie" --> API["Express API (Render)"]
    API -- Mongoose --> DB[("MongoDB Atlas")]
    Browser -. "static build" .-> CDN["Vercel"]
```

Cookie-based auth, split origins: the SPA and API are separate deployments, so every request carries the `tf_token` HttpOnly cookie cross-site (`SameSite=None; Secure` in production — see `DEPLOYMENT.md`).

## Request flow

```mermaid
flowchart TD
    Req([Request]) --> Helmet[helmet] --> Compression[compression] --> CORS[cors] --> Morgan[morgan] --> Json["express.json()"] --> Cookie[cookieParser]
    Cookie --> Router{route matched?}
    Router -- "/api/health*" --> Health["health.routes\n(liveness / readiness, no auth)"] --> Res([Response])
    Router -- no match --> NotFound[notFoundHandler → 404] --> Res
    Router -- yes --> Auth{"authenticate?\n(most routes)"}
    Auth -- "cookie/Bearer missing or invalid" --> Err
    Auth -- ok --> Role{"requireRole?\n(admin-only platform routes)"}
    Role -- "wrong role" --> Err
    Role --> Workspace{"resolveWorkspace?\n(/api/workspaces/:slug/...)"}
    Workspace -- "no such workspace, or not a member" --> Err
    Workspace --> WsRole{"requireWorkspaceRole?\n(owner/admin-only actions)"}
    WsRole -- "wrong workspace role" --> Err
    WsRole --> Validate{"validate(zod)?"}
    Validate -- "schema fails" --> Err
    Validate --> Controller[Controller] --> Model["Mongoose model"] --> DB[(MongoDB)]
    Controller --> Success([2xx JSON])
    Controller -- throws --> Err
    Err[/"next(err)"/] --> ErrorHandler["errorHandler\nApiError → status\nDuplicate key → 409\nunknown → 500"] --> Res
    Success --> Res
```

`authenticate` (`middleware/auth.ts`) loads the user by the JWT's `sub` on every request — no session cache. `resolveWorkspace` (`middleware/workspace.ts`) then loads the workspace named in `:slug` and the caller's membership, attaching `req.workspace`/`req.membership`; non-existent workspaces and non-members both 404. `validate` (`middleware/validate.ts`) runs wherever a route needs it — before `authenticate` on `/api/auth/register|login` since there's no user yet, after everything else elsewhere. Every controller is wrapped in `asyncHandler` so a thrown/rejected error always reaches `errorHandler`, never crashes the process.

## Authorization

Workspace-scoped, enforced by `services/authz.ts` once `req.workspace`/`req.membership` are resolved — not by role middleware alone, since some rules (`canManage`) also depend on task ownership. See `PLAN.md` for `scopeFilter`/`canView`/`canManage`/`canWrite`. Non-member workspace access and out-of-scope tasks both return `404`, never `403` — existence isn't leaked.

`User.role` (`admin`/`user`) is a platform-level flag only — it grants no tenant data access. All task/comment authorization comes from `WorkspaceMember.role` (`owner`/`admin`/`member`/`viewer`).

## Known constraint

The frontend hasn't been updated to expose any of this yet — no workspace switcher, no `/w/:slug` routes; it still calls the pre-Phase-1 API shape. See [`SCALING.md`](./SCALING.md) Phase 1 for what's left.
