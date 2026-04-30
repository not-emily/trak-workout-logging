# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-7.md](../docs/plan/phases/phase-7.md)
Latest Weekly Report: [weekly-2026-W17.md](../docs/reports/weekly-2026-W17.md)

Last Updated: 2026-04-29
Latest Daily Report: [daily-2026-04-27.md](../docs/reports/daily-2026-04-27.md)

## Current Focus
**Phase 7 (PWA Polish) built — code complete, ready to ship.** Phase 6 + 7 will deploy together. Real-device testing is the final manual validation step before v1 is done.

## Active Tasks
- [IN PROGRESS] Phase 7 ship + real-device validation
  - ✓ All 6 implementation steps complete (icons, service worker, header/offline UX, settings + sync issues, install prompt, update banner)
  - ⏭ Commit + push Phase 7
  - ⏭ Run `./scripts/deploy-backend.sh` so the Phase 6 `start_value` migration runs in prod
  - ⏭ Real-device testing pass: iPhone (Safari + installed PWA), Android (Chrome + installed PWA), airplane-mode toggles, cold-start from home screen, background↔foreground, full update flow
- [LATER] Heavy retheme — colors / font / vibe. Could weave in after v1 ships
- [LATER] Set `NPM_VERSION=11` env var on CF Pages project (one-time, prevents lockfile-format drift on future deploys)
- [LATER] Bundle size — Vite warns at 500kB; we're at 549kB minified / 165kB gzipped. Code-splitting could shave it but the spec didn't call for it

## Open Questions/Blockers
None

## Completed This Week
- [2026-04-27] **Phase 3+4 polish pass — UX-focused day**
  - **Layout / nav** matched to garnish:
    - Per-page max-width wrappers (`max-w-5xl` lists, `max-w-3xl` detail, `max-w-2xl` forms, `max-w-sm` auth)
    - Bottom nav: `h-11/w-11` tap targets, `py-3`, `pb-[calc(env(safe-area-inset-bottom)+0.5rem)]`, `pointer-events-none/auto` for click-through outside the pill
    - Removed the global FAB; added a contextual "+ New" header button on `SessionsListPage` that opens the same `ActionMenuSheet`
    - Pinch-to-zoom disabled via viewport meta
  - **New shared components in `components/ui/`:**
    - `BottomSheet` — `z-[60]`, safe-area + 1rem bottom padding. Used by `ActionMenuSheet` + `AddExerciseSheet` (fixed both being hidden behind nav)
    - `ConfirmDialog` — garnish-style at `z-[70]`, `variant: "danger"`. Replaced all 5 `confirm()` calls (finish/delete session, remove session exercise, delete routine, remove routine exercise, delete custom exercise)
    - `Swipeable` — generic horizontal swipe wrapper (right + left actions, ports the y-pin trick from garnish's `SwipeableGroceryItem`)
    - `MeatballMenu` — `…` button with click-outside dismissal, danger variant
    - `EmptyState` — dashed-border card with icon (Sessions, Routines, Exercises empty states)
  - **Set row rebuild** (`SetRow`):
    - "SET 1" stacked label
    - Read mode displays formatted text ("**135** lb × **8** reps", "**12** reps", "**30**s · **200** m") with `—` placeholders for empty values
    - Tap row → edit mode (black ring), explicit "Done" button + blur/Enter/tap-outside commits + collapses
    - Swipe-right to check (only on populated, uncompleted sets), swipe-left to delete; disabled in edit mode
    - Always pre-fill from previous set (removed the "must check first" rule)
  - **Routine planned sets** (`PlannedSetsEditor`): same read/edit pattern — "**3 sets** × **8** reps @ **135** lb" with pencil affordance, expands to existing 4-column form on tap
  - **Retroactive sessions** fixed:
    - `RetroactiveSessionPage` creates with `endedAt = startedAt` so the 144-hour timer bug is gone; navigates with `state: { startInEdit: true }`
    - `addSet` bug: `completedAt: null` was hardcoded; now respects `defaults.completedAt` so sets added to finished sessions auto-complete
    - Header on a finished session shows date + duration (if > 0) + "finished" instead of running elapsed
    - Tap-to-edit datetime fields (`Started` / `Ended`) in the header so duration is editable; `datetime-local` inputs with `isoToLocalInput` / `localInputToIso` helpers
  - **Read-only finished sessions** (UI-only `isEditing` flag, no schema change):
    - Live sessions: always editing
    - Finished sessions: read-only by default; **Edit** (pencil, gray) toggles to editing, **Done** toggles back. Doesn't touch `endedAt`
    - Fresh retroactive sessions land in editing mode via `state: { startInEdit: true }`
    - `readOnly` prop propagated to `SessionExerciseBlock` + `SetRow` — disables tap-to-edit, swipe, check button, Add Set, Add Exercise, Remove Exercise X
  - **Routine detail page** rebuild: header has `Start` (Play icon, primary CTA, disabled when no exercises) + meatball menu with Delete; bottom Start CTA removed; drag-reorder fixed in mobile emulation via `touch-action: none` on the grip handle
  - **Inline name/description edit** layout fix: input now `w-full` inside `min-w-0 flex-1` column; action buttons hidden while editing so the input gets the row to itself
  - **Routine create form** stacks on mobile (input full-width row 1, Cancel + Create row 2) with `min-w-0` to prevent overflow
  - **Back-to-sessions link** on `ActiveSessionPage` matching `RoutineDetailPage`'s pattern
  - All changes type-check clean (`tsc -b`); no dependencies added
- [2026-04-27] **Phase 5: Progress & PRs**
  - **`lib/prs.ts`** — pure PR math, all client-side. Epley 1RM, `findPRs(sets, kind)` returning a discriminated union (strength / bodyweight / cardio). `detectBrokenPRs(candidate, prior)` for live comparison
    - Strength PRs: heaviest weight, best-by-reps (1/3/5/8/10), best estimated-1RM, heaviest single-set volume
    - Cardio: longest distance, longest duration, fastest pace (sec/m)
    - Bodyweight: most reps in a single set
  - **Data hooks** (`features/progress/`)
    - `useExerciseHistory` — joins sets + session_exercises + sessions to produce `(set, date)` pairs sorted by session date
    - `useExerciseCompletedSets` — same data, projected into `CompletedSet` for the math layer
    - `useLoggedExerciseIds` — distinct exercises that have any completed set (powers the picker)
    - `usePRs(exerciseId, kind)` — derived PRs via `findPRs`
    - `seriesForMetric(history, metric)` — aggregates session-level data points (max for weight/reps/pace, sum for volume/distance/duration)
  - **Chart family** in `components/charts/` — total ~210 LOC
    - `LineChart` — viewBox-based responsive SVG, padded y-domain, polyline + dots, fixed 5-tick y-axis, evenly-spaced x-axis ticks ending on the last point
    - `ChartAxis` — gridlines + tick labels
    - `ChartTooltip` — pointer-tracking overlay rect, nearest-by-x lookup, dashed indicator line, tooltip in `<foreignObject>` with edge clamping
  - **Progress UI**
    - `ProgressPage` (replaces Phase 1 placeholder) — stat cards on top + scrollable list of logged exercises
      - **Stat cards** (`ProgressStatCards`): hero row (heaviest set + longest distance, all-time, with exercise name and date) + activity row (Sessions / Volume this week, PRs this month). Center-aligned on mobile, left-aligned on `sm:` and up. Each card self-hides when there's no data
      - `useProgressSummary` — aggregates the above from localStore. Week = ISO week (Mon start). Month = calendar 1st-of-month
    - `ExerciseProgressPage` — back link, kind badge, `MetricTabs` (kind-aware: weight/volume/est-1RM for strength, reps for bodyweight, pace/distance/duration for cardio), `LineChart` of selected metric with kind-aware y-formatter, `PRCardList` below
    - `MetricTabs`, `PRCard` / `PRCardList` — per-kind PR cards
  - **Toast system** (`components/ui/Toast.tsx`)
    - Module-level store, `toast.show/dismiss/dismissAll`, mounted as `ToastHost` in `AppShell` at `z-[80]`
    - **Sequential queue with visible stack** — front card at full size/opacity, behind cards scaled to 95%/90% with reduced opacity and y-offset (peek out below front). 4s active timer drives the cascade — when front exits, next animates forward
    - **Swipe-up-to-dismiss-all** on the front card (drag past 60px → `dismissAll`); tap front to dismiss just that one
  - **Live PR detection** (`features/session/usePRDetection`) — wired into `ActiveSessionPage`
    - Only runs while session is live (`endedAt === null`)
    - Per-exercise history snapshot taken at first init (excludes the current session's sets); already-completed session sets marked seen so no toasts on remount
    - On each newly-completed set, runs `detectBrokenPRs` against the cached history and fires success toasts ("New PR · Bench press · 200 lb × 5 — beats 180 lb"); appends candidate to local history so subsequent sets in the same session must beat it too
    - `bestByReps` PRs **suppressed from toasts** (mathematically implied by higher-rep PRs) — still surface on the PR cards for granular data
    - Max 3 toasts per strength set (heaviest weight, est-1RM, heaviest volume), 1 for bodyweight, up to 3 for cardio
  - Route added: `/progress/:id` → `ExerciseProgressPage`. tsc clean. No backend changes (PRs are client-side). No new dependencies
- [2026-04-27] **Deploy-pipeline fixes** — Cloudflare Pages was failing to build trak with "Missing: @emnapi/core from lock file" because CF Pages bundles `npm@10.9.2` (regardless of Node version) and trak's local lockfile was written by `npm@11`, which omits the `node_modules/@emnapi/{core,runtime}` entries that npm 10's strict `npm ci` requires. Triggered specifically because Vite 8 / Rolldown pulls in `@napi-rs/wasm-runtime` (with platform-conditional optionalDeps) — garnish doesn't hit this since it's still on Vite ≤6 / Rollup
  - Added `frontend/.nvmrc` pinning Node 24 (commit `bb1737e`) — got CF Pages onto Node 24 but didn't change npm (CF bundles npm separately)
  - Regenerated `package-lock.json` against `npm@10.9.2` via `npx -y npm@10.9.2 install` (commit `cc30265`) — now lockfile has the entries CF expects; `tsc -b` and `vite build` both pass locally
  - Long-term: set `NPM_VERSION=11` env var on the CF Pages project so trak permanently uses npm 11 like local — prevents drift on next install
  - Phases 3+4 polish, Phase 5, and the lockfile fix are all live at https://trak.1bit2bit.dev (frontend auto-deployed via CF Pages). Backend deploy still pending — no Phase 5 schema changes, so it's optional until Phase 6 ships
- [2026-04-29] **Phase 6: Body & Goals — initial build**
  - **Backend:** `BodyMeasurement` + `Goal` migrations, models, policies (with Scope), controllers, serializers; 17 new tests; `POLICY_CLASSES` registry updated; routes added
  - **Frontend types:** `bodyMeasurement.ts` (allowed metrics + default unit + label formatter), `goal.ts`
  - **Hooks:** `useBodyMeasurements` / `useLatestPerMetric` / `useMeasurementsForMetric`, `useGoals` / `useGoal`, `useGoalProgress` / `useGoalProgresses`
  - **Components:** `body/MetricCard`, `body/LogMeasurementSheet`, `goals/GoalCard` (with progress bar), `goals/GoalTypePicker`
  - **Pages:** `BodyPage` (replaces Phase 1 placeholder, hero "Current weight" card + metric grid + log button), `MetricDetailPage` (chart + swipe-to-delete history), `GoalsListPage`, `GoalFormPage`
  - **Goal achievement detection:** `useGoalAchievementDetection` mounted in `AppShell` — watches all goals app-wide, fires celebration toast and persists `achievedAt` when progress crosses target
  - **Routes added:** `/body/:metric`, `/goals`, `/goals/new`, `/goals/:id/edit`. Nav adds 5th tab (Target icon)
  - tsc clean; 87/87 backend tests passing; backend smoke-test confirms `/api/v1/body_measurements` and `/api/v1/goals` route correctly
- [2026-04-29] **Phase 6: bug fixes + UX polish from manual testing**
  - **Decrease-goal progress math fixed.** Old code did `target / current` which is mathematically meaningless (target=140 / current=150 = 93%, regardless of where you started). Added `start_value` decimal column to `goals` (migration `20260429000001_add_start_value_to_goals.rb`). `upsertGoal` snapshots at creation: latest body_measurement for body goals, best est-1RM for lift goals, null for frequency. New `useGoalStartValueBackfill` hook (mounted in AppShell) lazy-fills startValue when a goal was created before any data existed. Math now: increase = `(current − start) / (target − start)`, decrease = `(start − current) / (start − target)`, both clamped 0–100. Falls back to old behavior when no baseline exists.
  - **Frequency goals now count finished sessions, not started.** `frequencyProgress` filters on `endedAt !== null` and uses `endedAt` for the rolling 7-day cutoff. "Sessions per week" is honest now — a session you bailed out of doesn't tick the goal.
  - **Achievement state re-arms on edit.** `upsertGoal` clears `achievedAt` if any of `targetType` / `targetValue` / `direction` / `exerciseId` / `metric` change (renames preserve achievement). Detector re-runs the next render — if the new definition still satisfies the condition, it instantly re-marks. Otherwise the badge disappears until the user re-hits the new target. Required adding `seenAchievedRef.delete(g.id)` in the detector for goals where `achievedAt` becomes null.
  - **`AddExerciseSheet` → `ExercisePicker` (reusable).** Moved to `components/exercises/`, added optional `title` and `emptyMessage` props. Replaced the `<select>` in `GoalFormPage` with the searchable bottom sheet — consistent with sessions and routines, scales to long exercise lists. Updated 3 callers.
  - **"Est. 1RM" label on lift goal cards.** `GoalCard`'s ProgressBar now takes a `currentLabel` prop; lift goals show `Est. 1RM 64 / 130 lb` so the displayed number isn't ambiguous.
  - **`GoalDetailPage` at `/goals/:id`.** Goal cards now route to detail (not edit form). Detail page: back link, name + Achieved badge + pencil-to-edit button, hero with current/target/start/% progress bar, kind-aware chart — lift = best e1RM per session over time (reuses `LineChart`), body = metric over time (reuses `LineChart`), frequency = bar list of last 8 weeks of finished-session counts. Edit pencil → `/goals/:id/edit` (existing form). Updated `App.tsx` routes accordingly.
  - **Tests:** Added 2 new backend controller tests (`start_value` persistence + null default). 89/89 backend pass; frontend `tsc -b` clean.
- [2026-04-29] **Phase 7: PWA Polish — code complete**
  - **Sessions list moved to `/`.** App root is now the sessions list; `/sessions` redirects to `/`; bottom-nav matcher still recognizes `/sessions/*` so detail routes light up the sessions tab. 7 file edits across App.tsx + auth pages + nav.
  - **Manifest + icons (Twemoji 💪).** `scripts/generate_icons.sh` downloads the `1f4aa` SVG from jsdelivr (pinned `v14.0.2`), rasterizes via `rsvg-convert` at 700×700, composites onto a 1024×1024 black canvas, then resizes to 72/96/144/180/192/256/512. Same SVG is also dropped at `public/favicon.svg` so the browser tab matches the home-screen icon. Manifest covers `any` + `maskable` purposes (700/1024 ratio keeps the emoji inside Android's 80% safe zone). `index.html` got `apple-touch-icon`, `manifest`, `apple-mobile-web-app-capable/title/status-bar-style` meta tags.
  - **Hand-rolled service worker.** `frontend/src/sw.template.js` (~70 LOC) with install/activate/fetch + message handlers. Cache-first for app shell + static assets, network-first for navigation (falls back to `/index.html` for SPA boot offline), pass-through for `/api/*` (localStore is the API cache). `buildSwPlugin` in `vite.config.ts` (~30 LOC, `enforce: "post"`) reads the bundle's chunk filenames in `generateBundle`, computes a sha1 build version from the shell list, replaces `__BUILD_VERSION__` + `__APP_SHELL__` placeholder tokens, and emits `dist/sw.js`. SW is registered in `main.tsx` only when `import.meta.env.PROD`.
  - **Update detection store.** `sync/swRegister.ts` exposes `swUpdateStore` with `subscribe / hasUpdate / applyUpdate`. `applyUpdate` posts `{type: "SKIP_WAITING"}` to the waiting worker; `controllerchange` triggers a one-time reload. Black `UpdateBanner` ("Update available — tap to refresh") at the very top of the layout consumes the store via `useSyncExternalStore`.
  - **Offline UX.** `OfflineBanner` (yellow strip with `CloudOff` icon, "Offline — your logs are safe") renders inline below `UpdateBanner` when `navigator.onLine === false`. `useReconnectToast` in `AppShell` fires "X updates synced" toast — but only after a real offline period (gated by `wasOfflineRef`), so single online writes don't toast.
  - **Inline `SyncIndicator` pill.** Floating SyncIndicator scrapped after testing felt website-y. New inline pill renders directly in each list page's header row to the left of action buttons. Three states: red `AlertCircle` "N" linking to `/settings/sync-issues` when failed, blue `RefreshCw` spinner "Syncing… (N)" when online + pending, gray `CloudOff` "N pending" when offline + pending, otherwise hidden. Added to all 6 list pages (Sessions, Routines, Progress, Body, Goals, Exercises).
  - **No global header bar.** Sticky `TopBar` shipped initially, then removed — felt website-y with the wordmark. Replaced with: gear icon in the Sessions page header row only (with red-dot badge when failed entries exist). Other pages don't show the gear. Settings is reachable in 2 taps from anywhere.
  - **Settings + Sync issues pages.** `SettingsPage` at `/settings` (signed-in email, sync status row with conditional `CheckCircle2` / `AlertCircle` icon, install instructions for iOS + Android, "Install trak" button gated on `useInstallPrompt`'s `canInstall` for Android Chromium, sign out, version label from `__BUILD_LABEL__` injected by Vite `define`). `SyncIssuesPage` at `/settings/sync-issues` lists `queue.failed()` entries with Retry / Discard. Required `useSyncExternalStore` snapshot caching to avoid infinite re-render (queue.failed() returns fresh array each call) — module-level `cachedFailed` invalidated on `queue.subscribe` notification.
  - **Install prompt.** `useInstallPrompt` captures `beforeinstallprompt` at module load (fires earlier than React mounts). Returns `{canInstall, promptInstall}`. Single-use per Chrome's spec. `appinstalled` clears the deferred event.
  - **Hooks added:** `useReconnectToast`, `useGoalStartValueBackfill` (already shipped), `useInstallPrompt`. Frontend `tsc -b` clean. Production build emits `dist/sw.js` correctly with substituted tokens.
  - **Bundle size:** 549kB minified / 165kB gzipped. Vite warns at 500kB but the spec didn't call for code-splitting; deferred to post-launch.
  - **Real-device testing still pending** — that's the validation list at `phase-7.md:174–202`.

## Next Session
Commit + push Phase 7. Run `./scripts/deploy-backend.sh` to apply the Phase 6 `start_value` migration. Then real-device testing pass: install on iPhone via Add-to-Home-Screen, install on Android via the Settings page button, airplane-mode toggle while logging, cold-start offline, foreground/background transitions, full update flow (deploy a new build, watch the banner, tap to refresh). After that passes, v1 is done.
