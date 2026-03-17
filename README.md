# Skeleton

A full-stack TypeScript monorepo template for building web applications with authentication, file management, user administration, and Docker infrastructure. Designed to be cloned and customized as a starting point for new projects.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [Bun](https://bun.sh), [Elysia](https://elysiajs.com), [oRPC](https://orpc.unnoq.com) |
| Frontend | [Vue 3](https://vuejs.org), [Quasar 2](https://quasar.dev) (SSR), [Pinia](https://pinia.vuejs.org), [Vue-i18n](https://vue-i18n.intlify.dev) |
| Database | [PostgreSQL](https://www.postgresql.org), [Kysely](https://kysely.dev) ORM |
| Sessions | [Redis](https://redis.io) |
| Proxy | [Nginx](https://nginx.org) (HTTP/2, HTTP/3, TLS 1.2/1.3) |
| Containers | [Docker Compose](https://docs.docker.com/compose/) |

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

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url> my-project
cd my-project
cp .env.example .env

# 2. Edit .env — at minimum set VOLUME_PATH to a local directory

# 3. Start all services
docker compose up --build
```

Access at **https://localhost:8443** (accept the self-signed certificate).

### Default Users

All default passwords are `123456`.

| Email | Roles |
|---|---|
| `admin@mail.com` | Admin, Teacher |
| `teacher@mail.com` | Teacher |
| `student@mail.com` | Student |

## Features

### Authentication
- Session-based auth with HttpOnly cookies stored in Redis
- Login, logout, session renewal, password change
- Sessions auto-extend on every authenticated request
- Passwords hashed with Argon2id

### File Management
- Streaming file upload (up to 4 GB) with MIME detection and SHA-256 checksum
- Sharded disk storage for efficient file distribution
- Downloads served via nginx X-Accel-Redirect for optimal performance
- Per-user file listing, upload, download, and delete

### User Administration (Admin)
- Search users by keyword or list all
- Create, update, archive, block users
- Role management (admin, teacher)
- View user files and disk usage

### File Administration (Admin)
- Search files by filename or ID
- View file properties and owner details

### Frontend
- Server-side rendering (SSR) with Quasar
- Dark/light theme with localStorage persistence
- Internationalization (French by default, extensible)
- Apple-style UI design

### Infrastructure
- Multi-replica backend with nginx load balancing (`least_conn`)
- HTTP/2 and HTTP/3 support with TLS
- Separate Docker networks for security (backend/DB isolated from proxy)
- Persistent volumes for database, Redis, files, and logs
- Hot reload in development for both backend and frontend

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions. Key variables:

| Variable | Description | Default |
|---|---|---|
| `ENV` | `development` or `production` | `development` |
| `DOMAIN` | Public domain (include port if non-standard) | `localhost:8443` |
| `VOLUME_PATH` | Host path for persistent data | — |
| `ORGANIZATION` | Organization name shown in the app | `ORG-NAME` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `123456` |
| `POSTGRES_DB` | Database name | `skeleton` |
| `USER_SESSION_EXP` | Session TTL in seconds | `86400` |

## Development

### Hot Reload

Both backend and frontend hot-reload in development mode:
- **Backend**: `bun run --watch` (file changes restart automatically)
- **Frontend**: Quasar dev server with WebSocket HMR (port 24678)

Source code is mounted into containers via Docker volumes (`node_modules` excluded).

### Scaling Backend

The backend supports multiple replicas for load balancing. After changing the replica count in `docker-compose.yml`, restart nginx to re-resolve DNS:

```bash
docker compose restart nginx
```

### Database

PostgreSQL initializes automatically on first run using `packages/postgres/db.sql`, which creates the schema, functions, and seed data.

To connect directly:

```bash
docker compose exec postgres psql -U postgres -d skeleton
```

### Useful Commands

```bash
docker compose up --build        # Start all services
docker compose down              # Stop all services
docker compose logs -f backend   # Follow backend logs
docker compose restart nginx     # Re-resolve backend replicas
```

## Using as a Template

1. Clone this repository
2. Rename the project in `package.json`, `docker-compose.yml`, and `.env.example`
3. Update `packages/postgres/db.sql` with your schema
4. Add your pages in `packages/frontend/src/pages/`
5. Add your procedures in `packages/backend/src/orpc/Router.ts`
6. Update i18n translations in `packages/frontend/src/i18n/`

See [`CLAUDE.md`](CLAUDE.md) for detailed architecture documentation and conventions for AI-assisted development.

## License

MIT
