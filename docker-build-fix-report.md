# Docker Build Fix Report

Date: 2026-06-11
Scope: `deploy/docker/docker-compose.yml`, `backend/Dockerfile`, `frontend/frontend-admin/Dockerfile`, `frontend/frontend-user/Dockerfile`, `.dockerignore` files, `nginx.conf` files.

## Summary

`docker compose config` and `docker compose build` previously failed for the **backend** and **frontend-admin** services. After two targeted fixes, all three services build successfully, start successfully, and the Nginx reverse proxies correctly route `/api/` traffic to the backend.

---

## Root Cause Analysis

### 1. Backend image failed to build — `npm ci` requires a lockfile that doesn't exist

`backend/Dockerfile` ran:

```dockerfile
RUN npm ci --only=production
```

`npm ci` requires an existing `package-lock.json` (or `npm-shrinkwrap.json`). The `backend/` directory has no lockfile, so the build failed immediately with:

```
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1.
```

This is a Docker/build-tooling issue only — no application code was involved.

### 2. frontend-admin image failed at `npm run build` — missing dependency declaration

`frontend/frontend-admin/src/utils/supabase.ts` imports `@supabase/supabase-js`:

```ts
import { createClient } from '@supabase/supabase-js';
```

…but `frontend/frontend-admin/package.json` never listed `@supabase/supabase-js` as a dependency. `npm install` therefore didn't install it, and the Dockerfile's `RUN npm run build` step (`tsc -b && vite build`) failed during type-checking:

```
src/utils/supabase.ts(1,30): error TS2307: Cannot find module '@supabase/supabase-js'
or its corresponding type declarations.
```

This blocks the multi-stage Docker build at the build stage (stage 1), so the Nginx stage never gets the `dist/` output. Adding the missing dependency (matching the version already used by `frontend-user`) resolves it without touching any business logic.

### 3. docker-compose.yml, Dockerfiles, nginx.conf, .dockerignore — structurally correct

Everything else checked out:

- Build contexts (`../../backend`, `../../frontend/frontend-user`, `../../frontend/frontend-admin`) are correct relative to `deploy/docker/docker-compose.yml`.
- `dockerfile: Dockerfile` paths resolve correctly inside each context.
- `COPY nginx.conf /etc/nginx/conf.d/default.conf` — `nginx.conf` exists in both frontend contexts and is **not** excluded by `.dockerignore`.
- `COPY --from=build /usr/src/app/dist /usr/share/nginx/html` — matches the `WORKDIR /usr/src/app` and the Vite default output dir (`dist`), confirmed by both `vite.config.ts` files (no custom `build.outDir`).
- `.dockerignore` files do **not** exclude `package.json`, `package-lock.json`/`bun.lock`, `vite.config.ts`, `public/`, or `nginx.conf` — no accidental exclusions.
- Nginx configs are valid SPA configs (`try_files $uri $uri/ /index.html;`) with working reverse proxies to `http://backend:3000`.
- `depends_on`, `ports`, `environment`, and `container_name` in `docker-compose.yml` are all correct and required no changes.

---

## Files Modified

| File | Change | Reason |
|---|---|---|
| `backend/Dockerfile` | `npm ci --only=production` → `npm install --omit=dev` | No `package-lock.json` exists; `npm ci` cannot run without one. `npm install --omit=dev` is the modern equivalent of `--only=production` and works without a lockfile. |
| `frontend/frontend-admin/package.json` | Added `"@supabase/supabase-js": "^2.106.2"` to `dependencies` | Source code (`src/utils/supabase.ts`) imports this package but it was never declared, causing a TypeScript build failure inside the Docker build stage. Version matches the one already used in `frontend-user`. |
| `frontend/frontend-admin/.dockerignore` | Added `dist` | Excludes the locally-built `dist/` artifact (already present on disk and gitignored) from the Docker build context to keep the context clean and avoid shipping stale assets into the build stage. |
| `frontend/frontend-user/.dockerignore` | Added `dist` | Same reason as above (preventive — no `dist/` existed yet, but keeps both frontends consistent). |

### `docker-compose.yml`
No changes required — build contexts, dockerfile paths, ports, env vars, service names, and `depends_on` were all already correct.

### Other Dockerfiles / nginx.conf
No changes required for `frontend/frontend-admin/Dockerfile`, `frontend/frontend-user/Dockerfile`, or either `nginx.conf` — all paths and stages were already correct.

---

## Verification Performed

1. `docker compose config` — passes, resolves all three services with correct build contexts/args.
2. `docker compose build backend` — **passes** after fix #1.
3. `docker compose build frontend-admin` — **passes** after fix #2 (Vite build output: `dist/index.html`, `dist/assets/*`).
4. `docker compose build frontend-user` — **passes** (no changes needed; only EBADENGINE warnings, see below).
5. `docker compose up -d` — all three containers start and stay up:
   - `nateat-backend`: `Database connected: postgres on ...`, listening on port 3000.
   - `nateat-frontend-admin`: Nginx started, serving on port 5174.
   - `nateat-frontend-user`: Nginx started, serving on port 5173.
6. Smoke test via `curl`:
   - `http://localhost:5174/` → `200` (admin SPA served)
   - `http://localhost:5173/` → `200` (user SPA served)
   - `http://localhost:5174/api/` and `http://localhost:5173/api/` → `404` from Express (not `502`/`503`), confirming the Nginx `/api/` reverse proxy correctly reaches the backend container.
7. `docker compose down` — cleaned up test containers/network.

---

## Remaining Warnings (non-blocking)

- **frontend-user `npm install` EBADENGINE warnings**: Several `@tanstack/*` and `@cloudflare/kv-asset-handler` packages declare `engines.node >= 22`, but the Dockerfile uses `node:20-alpine`. These are warnings only — the build and runtime work correctly on Node 20. If you want to silence them, bump the base image in `frontend/frontend-user/Dockerfile` to `node:22-alpine` (not done here since it wasn't a build-blocking issue and is an optional version bump).
- **Large JS bundle for frontend-user**: Vite reports a chunk over 500 kB (`index-*.js`, ~1.1 MB). This is a build performance suggestion (consider code-splitting), not a build error.
- **Hardcoded credentials in `docker-compose.yml`**: `DATABASE_URL`, `JWT_SECRET*`, and `VITE_SUPABASE_*` values are committed in plaintext (pre-existing, not introduced by this fix). Consider moving these to an `.env` file (excluded from git) referenced via `env_file:`/`${VAR}` substitution. This is an infrastructure/secrets-hygiene recommendation, not a build issue, so it was left unchanged per the "Docker build issues only" scope.
- `npm` itself suggests upgrading from `10.8.2` to `11.x` in all three images — informational only.

---

## Final Build Status

| Service | `docker compose build` | Container starts | Notes |
|---|---|---|---|
| backend | ✅ Pass | ✅ Up, DB connected | |
| frontend-admin | ✅ Pass | ✅ Up, port 5174 | `/api/` proxy verified |
| frontend-user | ✅ Pass | ✅ Up, port 5173 | `/api/` proxy verified, EBADENGINE warnings only |

`docker compose config` ✅ Pass
`docker compose build` (all services) ✅ Pass
No COPY file-not-found errors, no nginx.conf errors, no build-context errors.
