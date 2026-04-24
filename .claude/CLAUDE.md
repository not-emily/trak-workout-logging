# Claude Context - trak

This file provides context for Claude Code sessions.

## Project Overview

**trak** is a personal gym/workout tracker PWA for Emily and family. It replaces a Notes.app workout-logging workflow with proper session logging, reusable routines, offline-capable sync, progress charts, PRs, body measurements, and goals.

It is not a product intended for public launch — it lives privately at `trak.1bit2bit.dev` (frontend) and `trak-api.1bit2bit.dev` (backend, on Emily's Mac via Cloudflare Tunnel, port 3002).

**Start here:** [docs/plan/plan.md](../docs/plan/plan.md). It is the canonical reference for everything — vision, scope, architecture, data model, API contract, sync-queue format, phase breakdown. Any implementation session should read it first.

## Tech Stack

- **Backend:** Rails 8.1 API, Ruby 3.3+, Postgres (shared with garnish), JWT auth, custom policy pattern
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, react-router v7, framer-motion, lucide-react, @dnd-kit (Phase 4+)
- **Hosting:** Mac + Cloudflare Tunnel (backend), Cloudflare Pages (frontend)
- **No:** TanStack Query, Workbox, charting library, IndexedDB wrapper — all done custom

## Key Patterns & Conventions

- **Local-first with queue-and-sync.** Writes go to localStorage first, then a sync worker drains the queue to the API. UI never blocks on network. See `plan.md` → Core Interfaces → Sync Queue Format.
- **Upsert-by-UUID on every write.** Every mutation is `PUT /api/v1/:resource/:id` where `id` is a client-generated UUID. Server upserts. Idempotent. See `Syncable` controller concern.
- **Custom policy pattern.** Advanced (structured result hash) + Scope hybrid. Follows `~/Work/personal/code-ref/rails/policies/`. Explicit `POLICY_CLASSES` registry in `ApplicationController` — never `.constantize`.
- **404 for cross-user reads.** Don't leak resource existence. Policy's `:not_visible` reason maps to 404.
- **No dependencies when DIY is reasonable.** Custom SVG chart instead of Recharts. Custom localStorage wrapper instead of Dexie. Hand-written service worker instead of Workbox. Framer-motion and @dnd-kit stay because hand-rolling FLIP animations and touch DnD is genuinely hard.
- **Backend conventions:** UUID primary keys (`gen_random_uuid()` via `pgcrypto`), snake_case, RESTful controllers, plain-Ruby serializers (no gem), Rails conventions otherwise.
- **Frontend conventions:** camelCase internally (snake↔camel conversion at `sync/apiClient.ts`), hooks prefixed `use*`, components PascalCase, Tailwind for all styling, route-level code splitting.
- **Boundary rules:**
  - Backend: controllers → models + policies. Never raw SQL in controllers. Policies are the only authorization layer. Serializers are the only response shape.
  - Frontend: routes glue features together; `features/` own domain hooks; `sync/` is the only module that touches localStorage or HTTP; `components/` are pure presentational; `lib/` is pure functions.

## Important Context

- **Stack mirrors garnish.** When making choices, check `../garnish/` for an existing pattern before inventing a new one.
- **Dependency preference:** Emily leans toward no new dependencies. Before proposing one, evaluate whether ~200 LOC of custom code would do it. Ask when in doubt.
- **Port layout:** backend 3002 (garnish uses 3000), frontend dev 5174 (garnish uses 5173), Postgres 5432 shared (different database names).
- **Multi-user:** Open signup but unmarketed. Per-user data isolation enforced by policies + Scope classes. No household/family concept — every user has independent data.
- **Offline is non-negotiable.** A set logged at the gym with no signal must never be lost. This shapes the sync architecture and the UUID approach.
- **Plan status:** All 7 phases designed, nothing implemented yet (as of 2026-04-22). Phase 1 is next.

## Project Structure

```
trak/
├── backend/              # Rails 8 API (not yet scaffolded)
├── frontend/             # Vite + React PWA (not yet scaffolded)
├── docs/
│   └── plan/             # Canonical project plan
│       ├── plan.md
│       └── phases/phase-1.md … phase-7.md
├── .claude/              # PXP project tracking (this directory)
├── scripts/              # Reusable helpers (to be populated)
├── docker-compose.yml    # (to be created in Phase 1)
├── Procfile.dev          # (to be created in Phase 1)
└── README.md             # (to be created in Phase 1)
```

## Helper Scripts

Scripts in `scripts/` are reusable helpers. **Before writing repetitive bash commands:**
1. Check if a script already exists in `scripts/`
2. If not, consider creating one for sequences you'll run again

This reduces permission prompts and ensures consistency.
