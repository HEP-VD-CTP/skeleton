# CLAUDE.md

## IMPORTANT: This is a Template Project

This codebase is a **skeleton/template** that provides the foundation (auth, file management, admin, infrastructure). Your job is to **build on top of it** — add new features, pages, tables, and procedures to create the actual application.

### Guardrails — What You MUST Follow

**DO:**
- Add new pages in `packages/frontend/src/pages/`
- Add new components in `packages/frontend/src/components/`
- Add new oRPC procedures in `packages/backend/src/orpc/Router.ts`
- Add new database tables in `packages/postgres/db.sql` AND `packages/postgres/migrate.sql` (idempotent version), and corresponding DAO files in `packages/lib/src/db/`
- Add kysely database types in `packages/lib/src/db/types.ts`
- Add new Zod validators in `packages/lib/src/utils.ts`
- Add i18n keys in BOTH `src/i18n/index.ts` AND `src/i18n/fr.ts` (always together)
- Follow the existing patterns: look at how `User.ts` DAO, or `Router.ts` are structured and replicate the same style
- Use the existing exception classes for error handling
- Use the existing auth middleware (`authedProcedure`, `adminProcedure`) for new procedures
- Coerce PostgreSQL BIGINT values to `Number()` in the DAO layer
- use uuidv7 as a key in postgres

**DO NOT:**
- Modify `docker-compose.yml` unless explicitly asked or really needed
- Modify `packages/nginx/nginx.conf` unless explicitly asked or really needed
- Modify `packages/backend/index.ts` (the Elysia server entry point) unless explicitly asked
- Modify `packages/lib/src/db/DB.ts` (database connection) unless adding a new table export
- Change the authentication flow or session management
- Change the file upload/download mechanism, if you need a new file upload/download route, copy and modify the current one
- Remove or rename existing files, functions, or exports that other parts of the codebase depend on
- Modify `.env.example` or `.env` unless explicitly asked or really needed
- Change the Dockerfile or build configuration
- Use default values for database fields. Always explicit types without default values.

### Before Marking a Feature as Done

- [ ] Backend procedure added with proper middleware (public/authed/admin)?
- [ ] Input validation uses Zod schemas?
- [ ] DAO functions throw appropriate exceptions (NotFoundException, ConflictException, etc.)?
- [ ] Frontend page created with route added in `routes.ts`?
- [ ] i18n keys added in BOTH `index.ts` (type) AND `fr.ts` (translation)?
- [ ] Navigation link added if the page should be accessible from the menu?
- [ ] Error handling in frontend uses `q.notify()` for user feedback?

## Project Overview

**Skeleton** is a full-stack TypeScript monorepo template for building web applications. It provides authentication, file management, user administration, and a ready-to-deploy Docker infrastructure. It is designed to be cloned and customized as a starting point for new projects.

- **Runtime**: Bun (backend + lib), Node.js (frontend SSR)
- **Language**: TypeScript everywhere

## Monorepo Structure

```
packages/
  backend/     Elysia + oRPC API server (port 9000)
  frontend/    Quasar (Vue 3) SSR app (port 8000)
  lib/         Shared library (DB models, utils, exceptions)
  nginx/       Reverse proxy with HTTP/2 & HTTP/3
  postgres/    PostgreSQL schema and seed data
  redis/       Redis session store
```

## Tech Stack

| Layer        | Technology                                    |
|-------------|-----------------------------------------------|
| Backend     | Bun, Elysia, oRPC                             |
| Frontend    | Vue 3, Quasar 2 (SSR), Pinia, Vue-i18n        |
| Database    | PostgreSQL, Kysely ORM                         |
| Sessions    | Redis                                          |
| Proxy       | Nginx (HTTP/2, HTTP/3, TLS 1.2/1.3)           |
| Containers  | Docker Compose (5 services)                    |

## Getting Started

```bash
cp .env.example .env        # configure env vars
docker compose up --build    # start all services
```

Access at `https://localhost:8443`. Default users (password: `123456`):
- `admin@mail.com` (admin + teacher)
- `teacher@mail.com` (teacher)
- `student@mail.com` (student)

## Architecture

### Backend (`packages/backend/`)

**Entry point**: `index.ts` — Elysia server on port 9000.

**oRPC procedures** (`src/orpc/Router.ts`):
- `auth.login`, `auth.renew`, `auth.logout`, `auth.changePassword`
- `file.list`, `file.remove`
- `admin.users.search`, `admin.users.getById`, `admin.users.update`, `admin.users.create`
- `admin.files.search`

**Procedure middleware chain**:
```
publicProcedure → authedProcedure → adminProcedure
```
Defined in `src/orpc/RPCUtils.ts`. Each layer adds context (cookies → user session → admin check).

**REST routes** (`src/rest/index.ts`):
- `POST /api/files` — streaming file upload (MIME detection, SHA-256 checksum, sharded storage)
- `GET /api/files/:fileId` — file download via nginx X-Accel-Redirect

**Authentication**: Session cookies stored in Redis. Sessions are extended on every authenticated request.

### Frontend (`packages/frontend/`)

**Framework**: Quasar 2 with SSR.

**Key files**:
- `src/router/routes.ts` — route definitions
- `src/stores/Store.ts` — Pinia store (user, theme, language, org)
- `src/lib/orpc.ts` — typed oRPC client
- `src/layouts/MainLayout.vue` — app shell with SSR prefetch
- `src/boot/i18n.ts` — Vue-i18n setup

**Pages**:
- `/` — `IndexPage.vue` (dashboard, file list, upload/download/delete)
- `/login` — `LoginPage.vue`
- `/logout` — `LogoutPage.vue`
- `/admin/users` — `AdminUsersPage.vue` (admin-only user management with auto-save)
- `/admin/files` — `AdminFilesPage.vue` (admin-only file browser with owner details)

**i18n**: French (`fr`) only. Schema in `src/i18n/index.ts`, translations in `src/i18n/fr.ts`. Both files must be updated together when adding keys.

**Path aliases** (tsconfig): `src/*`, `stores/*`, `components/*`, `layouts/*`, `pages/*`, `assets/*`, `boot/*`, `@Stendhal/backend/*`, `@Stendhal/lib/*`.

### Shared Library (`packages/lib/`)

**Exports** (via `index.ts`):
- `utils.uuidv7()` — UUID v7 generation
- `utils.sanitizeFilename()` — filename sanitization
- `utils.fileShardPath()` — sharded path from UUID
- Zod validators: `nameValidation`, `passwordValidation`, `emailValidation`, `uuidValidation`, `descriptionValidation`

**Database layer** (`src/db/`):
- `DB.ts` — Kysely instance with `postgres-js` dialect
- `User.ts` — User DAO (login, create, getById, update, archive, search, getAll)
- `File.ts` — File DAO (create, getById, getByUserId, update, updateLastAccess, remove)
- `Store.ts` — Redis session management (createSession, getSession, extendSession, deleteSession)
- `types.ts` — TypeScript interfaces for database tables

**Exceptions** (`src/Exceptions.ts`):
- BadRequest (400), Unauthorized (401), Forbidden (403), NotFound (404), Conflict (409), ContentTooLarge (413)

### Database (`packages/postgres/`)

**Schema** (`db.sql`):
- `users` table with UUID v7, full-text search (tsvector), unique email constraint (non-archived)
- `file` table with foreign key to users, cascade delete
- Custom `uuid_v7()` PL/pgSQL function
- Seed data with 3 default users

**Migration** (`migrate.sql`):
- Idempotent version of `db.sql` — executed by the backend on every startup via `packages/backend/src/migrate.ts`
- Uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`
- Coordinated across backend replicas using a PostgreSQL advisory lock (only one replica runs the migration)
- Both `db.sql` and `migrate.sql` must be kept in sync when adding new tables or indexes

**Important**: The table is named `users` (not `user`) to avoid PostgreSQL reserved keyword issues.

### Infrastructure

**Docker Compose services**:
| Service   | Networks                          | Notes                              |
|-----------|-----------------------------------|------------------------------------|
| backend   | skeleton_network, nginx_network   | 1+ replicas, hot reload in dev     |
| frontend  | skeleton_network, nginx_network   | SSR, WebSocket for HMR             |
| nginx     | nginx_network                     | depends_on backend + frontend      |
| postgres  | skeleton_network                  | persistent volume                  |
| redis     | skeleton_network                  | AOF persistence                    |

**Nginx** (`packages/nginx/nginx.conf`):
- Upstream `backend` block with `least_conn` + `keepalive 64`
- `/` → frontend, `/api/*` → backend, `/api/files` → backend (4GB limit)
- `/internal-files/` — internal location for X-Accel-Redirect file serving
- Port 24678 for Quasar WebSocket dev mode

**File storage**: Files are stored on disk at `/data/files/` using sharded directories (last 6 hex chars of UUID split into 3 pairs). Nginx serves downloads directly via X-Accel-Redirect.

## Key Patterns and Conventions

### Adding a new oRPC procedure
1. Add the procedure in `packages/backend/src/orpc/Router.ts` using `publicProcedure`, `authedProcedure`, or `adminProcedure`
2. Use Zod schemas from `packages/lib/src/utils.ts` for input validation
3. The frontend oRPC client auto-infers types from the router

### Adding a new page
1. Create `.vue` file in `packages/frontend/src/pages/` and components in `packages/frontend/src/components/`
2. Add route in `packages/frontend/src/router/routes.ts`
3. Add i18n keys in both `src/i18n/index.ts` (type schema) and `src/i18n/fr.ts` (translation values)

### Adding a new database table
1. Add SQL in `packages/postgres/db.sql` (used for first-time Docker init)
2. Add the same table/indexes in `packages/postgres/migrate.sql` using **idempotent** statements (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`). This file runs on every backend startup.
3. Add TypeScript interface in `packages/lib/src/db/types.ts` (use plain types, not `Generated`)
4. Create DAO file in `packages/lib/src/db/`
5. Export from `packages/lib/src/db/DB.ts`

### Type conventions
- `types.ts` uses plain TypeScript types with `Insertable<T>` and `Updateable<T>` from Kysely
- Do NOT use Kysely's `Generated<T>` type wrapper — use explicit types and pass all required fields on insert
- All table interfaces must list every column with its exact type
- PostgreSQL BIGINT columns are returned as strings by the driver — coerce to `Number()` in the DAO layer

### Error handling
- Backend: throw custom exceptions from `packages/lib/src/Exceptions.ts`
- Frontend: catch errors and use `q.notify()` for user feedback
- Use `assertOwnerOrAdmin(context, resourceOwnerId)` for ownership checks

### File operations
- Upload: POST raw body to `/api/files` with `X-Filename` header, `credentials: 'include'`
- Download: GET `/api/files/:fileId` — triggers browser download
- Delete: oRPC `file.remove` — deletes from disk and database

### UI conventions
- Apple-style design: rounded cards, subtle backgrounds, system font weights
- Admin pages use a two-panel layout (left: search/list, right: details)
- Form changes auto-save with debounce (no save button)
- Dark mode supported — use `rgba()` colors and `.body--dark` scoped overrides

## Environment Variables

See `.env.example` for full list. Key variables:
- `ENV`: `development` or `production`
- `DOMAIN`: public domain (e.g., `localhost:8443`)
- `VOLUME_PATH`: host path for persistent data
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: database credentials
- `USER_SESSION_EXP`: session TTL in seconds (default: 86400)

## Development Notes

- Backend hot reloads via `bun run --watch`
- Frontend hot reloads via Quasar dev server with WebSocket HMR
- Source code is mounted into containers via Docker volumes (node_modules excluded)
- After scaling backend replicas, restart nginx to re-resolve DNS: `docker compose restart nginx`
- Passwords are hashed with Argon2id via `Bun.password.hash()`
- PostgreSQL initializes automatically on first run using `packages/postgres/db.sql`
- On every backend startup, `packages/postgres/migrate.sql` runs to apply any missing tables/indexes (idempotent, safe with multiple replicas)
