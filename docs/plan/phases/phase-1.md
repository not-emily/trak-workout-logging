# Phase 1: Foundation

> **Depends on:** None
> **Enables:** All subsequent phases
>
> See: [Full Plan](../plan.md)

## Goal

Stand up a Rails 8 API and a Vite/React PWA skeleton with working JWT auth end-to-end, the policy system in place, and a placeholder nav shell deployed to production hosting.

## Key Deliverables

- Backend repo scaffolded with Rails 8 API, Postgres, UUID primary keys
- `User` model and JWT-based auth (signup, login, `/auth/me`)
- Policy system scaffold: `PolicyResult` module, `ApplicationController` registry + `authorize!` + `policy_scope` + `authorization_message`
- `Authenticatable` and `Syncable` controller concerns
- CORS configured for dev and prod frontend origins
- Frontend repo scaffolded with Vite, React 19, TypeScript, Tailwind 4
- `sync/apiClient.ts` with JWT handling
- Login and signup screens
- `BottomNav` pill with 4 tabs + "+" satellite (non-functional placeholders; just layout and morph animation)
- Route-level code splitting in place
- Backend deployed on Mac via Cloudflare Tunnel as `trak-api.1bit2bit.dev` (internal port 3002)
- Frontend deployed to Cloudflare Pages at `trak.1bit2bit.dev`

## Files to Create

**Backend:**
- `backend/Gemfile` — Rails 8.1, pg, puma, bcrypt, jwt, rack-cors
- `backend/config/application.rb` — API-only Rails config
- `backend/config/database.yml` — `trak_development`, `trak_test`, `trak_production`
- `backend/config/routes.rb` — `/api/v1/*` namespace, auth endpoints
- `backend/config/initializers/cors.rb` — Allow `trak.1bit2bit.dev`, `http://localhost:5174`
- `backend/config/initializers/jwt.rb` — Secret + expiry constants
- `backend/db/migrate/*_create_users.rb` — UUID PK, email unique, password_digest, name
- `backend/db/migrate/*_enable_pgcrypto.rb` — Enable `pgcrypto` for `gen_random_uuid()`
- `backend/app/models/user.rb` — `has_secure_password`, email validation
- `backend/app/controllers/application_controller.rb` — `POLICY_CLASSES`, `POLICY_SCOPE_CLASSES`, `authorize!`, `policy_scope`, `get_policy`, `authorization_message`
- `backend/app/controllers/concerns/authenticatable.rb` — JWT decode, `@current_user`, `authenticate_user!`, silent refresh via `X-Refreshed-Token`
- `backend/app/controllers/concerns/syncable.rb` — `upsert_by_uuid(Model, params, parent_check:)`
- `backend/app/controllers/api/v1/auth_controller.rb` — `signup`, `login`, `me`
- `backend/app/policies/concerns/policy_result.rb` — `allow`, `deny(reason)` helpers
- `backend/app/serializers/user_serializer.rb` — `{ id, email, name, created_at }`
- `backend/test/` — Minitest setup, auth controller tests

**Frontend:**
- `frontend/package.json` — React 19, Vite 8, TypeScript, Tailwind 4, react-router, framer-motion, lucide-react
- `frontend/vite.config.ts` — Dev server on port 5174
- `frontend/tailwind.config.js` — Tailwind 4 config
- `frontend/tsconfig.json`
- `frontend/index.html`
- `frontend/src/main.tsx` — App entry
- `frontend/src/App.tsx` — Router shell
- `frontend/src/routes/auth/LoginPage.tsx`
- `frontend/src/routes/auth/SignupPage.tsx`
- `frontend/src/routes/sessions/SessionsListPage.tsx` — Placeholder
- `frontend/src/routes/routines/RoutinesListPage.tsx` — Placeholder
- `frontend/src/routes/progress/ProgressPage.tsx` — Placeholder
- `frontend/src/routes/body/BodyPage.tsx` — Placeholder
- `frontend/src/components/layout/BottomNav.tsx` — Pill nav with 4 tabs + "+" satellite (morph only; no action menu yet)
- `frontend/src/components/layout/AppShell.tsx` — Outlet wrapper with BottomNav
- `frontend/src/features/auth/useAuth.ts` — Hook over `localStorage` token + current user
- `frontend/src/sync/apiClient.ts` — `get`/`put`/`delete` with JWT header + `X-Refreshed-Token` handling
- `frontend/src/sync/localStore.ts` — Minimal skeleton (full impl in Phase 3)
- `frontend/src/lib/uuid.ts` — `crypto.randomUUID()` wrapper
- `frontend/src/types/user.ts`, `frontend/src/types/api.ts`
- `frontend/src/styles/index.css` — Tailwind entry

**Infra:**
- `docker-compose.yml` — Postgres service on 5432 (only used if not sharing garnish's)
- `Procfile.dev` — `backend: cd backend && bin/rails s -p 3002`; `frontend: cd frontend && npm run dev`
- `README.md` — Dev setup instructions

## Dependencies

**Internal:** None — this is the foundation phase.

**External:**
- `rails` (~> 8.1) — API framework
- `pg` — Postgres driver
- `puma` — App server
- `bcrypt` — Password hashing
- `jwt` — Token generation and verification
- `rack-cors` — CORS middleware
- `bootsnap` — Boot time
- `react`, `react-dom` — UI
- `react-router` — Routing
- `typescript`, `vite` — Tooling
- `tailwindcss`, `@tailwindcss/vite` — Styling
- `framer-motion` — Pill nav morph animation (`layoutId`)
- `lucide-react` — Icons

## Implementation Notes

### Policy pattern specifics

Follow the advanced policy pattern from `~/Work/personal/code-ref/rails/policies/advanced/` combined with the Scope pattern from `.../basic/`. `authorize!` renders JSON (`render json: { error: message }, status: :forbidden`) instead of redirecting, because this is an API. When a policy denies with `:not_visible`, render 404 with `{ "error": "Resource not found" }` instead of 403.

`POLICY_CLASSES` and `POLICY_SCOPE_CLASSES` remain explicit hashes. Never use `.constantize`.

### JWT details

- Payload: `{ sub: user.id, iat:, exp: }`
- Secret: `Rails.application.credentials.jwt_secret` (set via `rails credentials:edit`)
- Expiry: 30 days
- Refresh: on any successful authenticated request, if `exp - now < 7 days`, issue a new token and return it as `X-Refreshed-Token` response header. Client apiClient swaps it into localStorage.

### Nav shell

- `BottomNav` matches garnish's `BottomNav` pattern with `layoutId`-based pill-and-satellite morph, but the satellite is a "+" that doesn't do anything yet (tap does nothing; pointer events no-op). Visual morph can be wired up; just no menu content.
- 4 tabs: Sessions, Routines, Progress, Body. Each navigates to its placeholder page.
- Active tab highlighted via `layoutId="nav-active-bg"` same as garnish.

### Deployment

- Backend: running locally on Mac, exposed via `cloudflared tunnel` to `trak-api.1bit2bit.dev`.
- Frontend: Cloudflare Pages, auto-deployed from `main` branch of the repo. Env var `VITE_API_BASE_URL=https://trak-api.1bit2bit.dev`.
- Confirm Cloudflare Tunnel routes `trak-api.1bit2bit.dev` → `http://localhost:3002`.

### Port conflicts

- Backend port 3002 (garnish uses 3000). Confirm no other local service uses 3002.
- Frontend dev port 5174 (garnish uses 5173).
- Postgres 5432 is shared with garnish. Just use a different database name.

## Sub-phases

### 1.1: Backend scaffold
**Goal:** Rails 8 API booting, Postgres connected, UUID PKs working, `users` table created.
**Deliverables:** Running Rails server on port 3002, `rails db:create db:migrate` succeeds, `User.create!` works in console.

### 1.2: Backend auth + policies
**Goal:** Full auth pipeline and policy infrastructure.
**Deliverables:** `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` all work. `Authenticatable`, `Syncable` concerns written. `ApplicationController` has full `authorize!` / `policy_scope` helpers. `PolicyResult` module ready to include.

### 1.3: Frontend scaffold + auth
**Goal:** Vite app boots, login and signup screens work against the backend.
**Deliverables:** Running Vite server on 5174. Login page submits to `/api/v1/auth/login`, token stored in `localStorage` under `trak.auth.token`, authenticated fetch includes `Authorization: Bearer ...`, `/auth/me` fetched successfully post-login.

### 1.4: Nav shell
**Goal:** BottomNav pill + 4 placeholder pages routed.
**Deliverables:** Pill nav renders; tapping tabs animates the active highlight. "+" satellite renders but is non-functional. Each placeholder page shows its name.

### 1.5: Deploy
**Goal:** Accessible from a phone browser.
**Deliverables:** Cloudflare Tunnel live on `trak-api.1bit2bit.dev`. Cloudflare Pages serving at `trak.1bit2bit.dev`. Signup + login work end-to-end over the internet.

## Validation

- [ ] `rails s -p 3002` starts cleanly; `/api/v1/auth/me` returns 401 without a token
- [ ] `POST /api/v1/auth/signup` with valid body returns `{ data: { token, user } }`
- [ ] `POST /api/v1/auth/login` with correct credentials returns a token; wrong password returns 401
- [ ] `GET /api/v1/auth/me` with a valid `Bearer` token returns the current user
- [ ] Token near expiry triggers an `X-Refreshed-Token` header
- [ ] `ApplicationController#authorize!` renders JSON 403 on denied actions and JSON 404 on `:not_visible` denials
- [ ] Frontend signup flow creates an account and navigates to `/sessions`
- [ ] Frontend login flow stores the token and navigates to `/sessions`
- [ ] Logout clears the token and redirects to `/login`
- [ ] BottomNav pill visually animates between active tabs
- [ ] App installed to iOS home screen; login works (even if manifest is basic)
- [ ] `trak-api.1bit2bit.dev` reachable from the public internet with working CORS
- [ ] `trak.1bit2bit.dev` serves the built app and can sign up / log in
