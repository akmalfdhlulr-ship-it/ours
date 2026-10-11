# OURS — Monorepo

> A private space for our story. Premium couple lifestyle application.

---

## 1. Monorepo Architecture

OURS is structured as a **modular monolith** with pnpm workspaces and Turborepo:

```
ours/
├── apps/
│   ├── app/                    # Expo SDK 57 + React Native (iOS, Android, Web)
│   ├── api/                    # NestJS modular monolith backend API
│   └── worker/                 # Background processor stub (BullMQ / Redis)
├── packages/
│   ├── database/               # Prisma ORM schema (21 models) & client
│   ├── contracts/              # Shared API types and request/response contracts
│   ├── core/                   # Domain constants, enums, error hierarchy, utilities
│   ├── design-tokens/          # Official Stitch UI tokens (colors, typography, spacing)
│   └── config/                 # Shared TSConfig and ESLint configs
├── infrastructure/             # Docker Compose (PostgreSQL 16, Redis 7)
├── docs/                       # Official architecture, domain, and design specifications
└── AGENTS.md                   # Workspace engineering invariants
```

---

## 2. Prerequisites

- **Node.js:** >= 20.x (tested on v24.x)
- **pnpm:** >= 9.x (installed: v11.9.0)
- **Docker / Docker Compose:** (for local Postgres 16 & Redis 7)

---

## 3. Getting Started

### 3.1 Install Dependencies
```bash
pnpm install
```

### 3.2 Environment Configuration
Copy `.env.example` to `.env` at repository root:
```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Connection string to PostgreSQL (Supabase session pooler on port 5432 with `?pgbouncer=true&connection_limit=1`).
- `DIRECT_URL`: Direct connection string used for migrations.
- `PAIRING_CODE_HMAC_SECRET`: 64-character secret for HMAC pairing code generation.
- `STORAGE_DRIVER`: `local` for local development or `cloudinary` for production.
- `PORT`: API server port (default `3000`).

### 3.3 Database Client Generation
Generate the Prisma client:
```bash
pnpm --filter @ours/database generate
```
> **Important:** Do NOT run `prisma db push`, `prisma migrate dev`, or `prisma db seed` without explicit owner authorization.

### 3.4 Build Workspace
Build all packages and apps:
```bash
pnpm build
```

---

## 4. Development Workflow

### 4.1 Starting the NestJS Backend API
```bash
pnpm --filter @ours/api start:dev
```
The API starts on port `3000` with the global prefix `/api/v1`.

Endpoints:
- `GET /api/v1/health/live`: Process liveness probe (200 OK)
- `GET /api/v1/health/ready`: Dependency readiness probe (verifies PostgreSQL connection)

### 4.2 Starting the Expo Application
```bash
pnpm --filter @ours/app start
```
Options:
- Web: `pnpm --filter @ours/app web`
- iOS: `pnpm --filter @ours/app ios`
- Android: `pnpm --filter @ours/app android`

### 4.3 Starting Background Infrastructure Locally
For local PostgreSQL 16 and Redis 7:
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

---

## 5. Testing & Verification

Run tests across all workspaces:
```bash
pnpm test
```

Run TypeScript type-checks across all workspaces:
```bash
pnpm type-check
```

Run linting:
```bash
pnpm lint
```

---

## 6. Infrastructure & Adapters Status

| Service | Selected Provider | Phase 03 Status | Note |
|---|---|---|---|
| Database | Supabase (PostgreSQL 16) | **IMPLEMENTED** | Prisma 6.19.3, 21 models preserved |
| Media Storage | Cloudinary | **MOCKED** (Local fallback) | `StorageAdapter` abstraction; fails fast in production if unconfigured |
| Transactional Email | Resend / SMTP | **MOCKED** | `EmailAdapter` abstraction (safe logging) |
| Places Provider | Google Places (New) | **MOCKED** | `PlacesAdapter` abstraction |
| Push Notifications | Expo Push Service | **MOCKED** | `NotificationAdapter` abstraction |
| Background Queue | BullMQ + Redis | **MOCKED** (Memory queue) | `QueueAdapter` abstraction |

---

## 7. Phase Implementation Roadmap

- [x] **Phase 01:** Architecture Documentation & Database Design
- [x] **Phase 02:** Design Contracts & Stitch UI System
- [x] **Phase 03:** Engineering Foundation (Monorepo, NestJS bootstrap, Health checks, Shared packages)
- [ ] **Phase 04:** Authentication, Space Creation & Partner Pairing
- [ ] **Phase 05:** Home Dashboard & Places Module
