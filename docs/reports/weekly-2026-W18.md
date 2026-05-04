# Weekly Report - trak - Week of 2026-04-27 (W18)

## Week Overview
The big build week — Phases 3+4 polish, Phase 5 (Progress & PRs), Phase 6 (Body & Goals), and Phase 7 (PWA Polish) all landed. Capped on Saturday 2026-05-03 with both frontend and backend deployed to production. Real-device testing is the only thing standing between trak and v1.

## Key Accomplishments

### UX foundation (Phase 3+4 polish)
- Layout matched to garnish (per-page max-widths, bottom-nav tap targets, pinch-zoom disabled)
- New shared UI primitives in `components/ui/`: `BottomSheet`, `ConfirmDialog`, `Swipeable`, `MeatballMenu`, `EmptyState`
- `SetRow` rebuild — read/edit modes, swipe-to-check / swipe-to-delete, always pre-fill from previous set, "SET 1" stacked label
- `PlannedSetsEditor` with the same read/edit pattern
- Retroactive sessions fixed (144-hour timer bug, set-completion default, editable start/end)
- Read-only finished sessions (UI-only `isEditing` flag — Edit pencil toggles back to editing)
- Routine detail rebuild: header `Start` CTA + meatball menu, drag-reorder via `touch-action: none`

### Progress & PRs (Phase 5)
- `lib/prs.ts` — pure PR math, all client-side. Epley 1RM, `findPRs` discriminated union (strength/bodyweight/cardio), `detectBrokenPRs` for live comparison
- Data hooks: `useExerciseHistory`, `useExerciseCompletedSets`, `useLoggedExerciseIds`, `usePRs`, `seriesForMetric`
- Hand-rolled chart family (~210 LOC): `LineChart`, `ChartAxis`, `ChartTooltip` — viewBox-based responsive SVG, padded y-domain, pointer-tracking tooltip
- `ProgressPage` + stat cards (heaviest set, longest distance hero + sessions/volume/PRs activity row)
- `ExerciseProgressPage` with kind-aware `MetricTabs` and per-kind `PRCardList`
- Toast system with sequential queue + visible stack + swipe-up-to-dismiss-all
- Live PR detection wired into `ActiveSessionPage` — fires success toasts when newly-completed sets break records, only while session is live, max 3 toasts per strength set, `bestByReps` suppressed from toasts as mathematically redundant

### Body & Goals (Phase 6)
- Backend: `BodyMeasurement` + `Goal` migrations, models, policies (with Scope), controllers, serializers; 17 new tests; routes added
- Frontend hooks for measurements + goals + progress
- Components: `MetricCard`, `LogMeasurementSheet`, `GoalCard` (with progress bar), `GoalTypePicker`
- Pages: `BodyPage` (replaces Phase 1 placeholder), `MetricDetailPage`, `GoalsListPage`, `GoalFormPage`
- App-wide `useGoalAchievementDetection` — fires celebration toast and persists `achievedAt` when progress crosses target
- 5th nav tab added (Target icon)

### Phase 6 bug fixes (manual-testing pass)
- **Decrease-goal math fix** — added `start_value` decimal column, snapshot at goal creation, math now `(start − current) / (start − target)` clamped 0–100. Old `target / current` was meaningless. Lazy backfill via `useGoalStartValueBackfill`
- **Frequency goals count finished sessions** — filter on `endedAt !== null` so a bailed session doesn't tick the goal
- **Achievement re-arms on edit** — clears `achievedAt` if `targetType` / `targetValue` / `direction` / `exerciseId` / `metric` change (renames preserve)
- **`AddExerciseSheet` → `ExercisePicker`** moved + made reusable, replaced `<select>` in `GoalFormPage`
- **`GoalDetailPage`** at `/goals/:id` — kind-aware chart (lift = e1RM over time, body = metric over time, frequency = 8-week bar list)

### PWA Polish (Phase 7)
- Sessions list moved to `/`, `/sessions` redirects to `/`
- Manifest + Twemoji 💪 icons via `scripts/generate_icons.sh` — pinned jsdelivr v14.0.2, rasterized via `rsvg-convert`, composited on 1024×1024 black canvas, resized to 8 sizes. Maskable + any purposes
- Hand-rolled service worker (`sw.template.js` ~70 LOC) — cache-first app shell, network-first navigation, pass-through `/api/*`. `buildSwPlugin` in `vite.config.ts` injects `__BUILD_VERSION__` + `__APP_SHELL__` at build time
- `swUpdateStore` + `UpdateBanner` — `SKIP_WAITING` message + one-time reload on `controllerchange`
- `OfflineBanner` + `useReconnectToast` (gated by `wasOfflineRef` so single online writes don't toast)
- Inline `SyncIndicator` pill on every list page (red/blue/gray states)
- `SettingsPage` + `SyncIssuesPage` with `useInstallPrompt` capture of `beforeinstallprompt`
- iOS status bar overlap fix on installed PWA (commit `880c8a8`)

### Deploy pipeline + production
- Cloudflare Pages was failing on "Missing: @emnapi/core from lock file" — CF bundles `npm@10.9.2` regardless of Node version, but trak's lockfile was npm@11. Vite 8 / Rolldown pulls in `@napi-rs/wasm-runtime` (platform-conditional optionalDeps); garnish doesn't hit this since it's still on Vite ≤6 / Rollup
- Pinned Node 24 via `frontend/.nvmrc`, regenerated lockfile against npm@10.9.2
- 2026-05-03: Frontend live at https://trak.1bit2bit.dev (auto-deploy on push), backend live at https://trak-api.1bit2bit.dev with the Phase 6 `start_value` migration applied via `./scripts/deploy-backend.sh`

## Decisions This Week
No formal entries added to `DECISIONS.md`. The notable in-practice course-corrections this week (worth logging if they recur):

1. **Inline `SyncIndicator` pill over floating** — the floating version felt website-y in testing. Inline pill in each list-page header row reads as part of the data, not chrome.
2. **No global header bar** — `TopBar` shipped initially with the wordmark, then removed for the same "felt website-y" reason. Replaced with a contextual gear icon on Sessions only (with red-dot badge for failed entries).
3. **Pin Node 24 + regenerate lockfile against npm 10** — Cloudflare Pages bundles npm 10 and ignores the project's Node version for npm. Long-term fix is `NPM_VERSION=11` env var on the CF Pages project (still pending).
4. **`start_value` snapshot column** — necessary because percent-progress for "decrease" goals is meaningless without a baseline. Lazy-backfill hook covers goals created before any data existed.

## Challenges Encountered
- **Decrease-goal math** — had it wrong on first ship; the formula `target / current` returns the same percent at any starting point. Surfaced via manual testing, fixed with the `start_value` migration.
- **`useSyncExternalStore` infinite re-render** in the sync issues page — `queue.failed()` returns a fresh array each call, which trips React's identity check. Solved with module-level `cachedFailed` invalidated on `queue.subscribe`.
- **dnd-kit drag on mobile emulation** — page panned instead of dragging. Fixed via `touch-action: none` on the grip handle.
- **CF Pages npm version mismatch** — described above; fixed by regenerating the lockfile.

## Metrics
- Commits: 7 (Phase 3+4, Phase 5, npm pin, lockfile regen, Phase 6, Phase 7, iOS status bar)
- Files changed: ~127
- Lines: +6,244 / −706
- Backend tests: +19 (87 → 89, all passing)
- Bundle: 549kB minified / 165kB gzipped (warning at 500kB; deferred)

## Next Week Priorities
1. **Real-device validation pass** — install on iPhone via Add-to-Home-Screen, install on Android via Settings page button, airplane-mode toggle while logging, cold-start offline, foreground/background transitions, full update flow. Last gate before v1 is done.
2. **Heavy retheme** — colors, fonts, vibe. Was [LATER] going into the week, may bubble up since the rest of the app is functionally complete.
3. **`NPM_VERSION=11` env var on CF Pages** — one-time, prevents lockfile-format drift on future deploys.
4. **Bundle size** — code-splitting could shave the 549kB warning; not blocking.
