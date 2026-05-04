# Project Progress - trak

## Plan Files
Roadmap: [plan.md](../docs/plan/plan.md)
Current Phase: [phase-7.md](../docs/plan/phases/phase-7.md)
Latest Weekly Report: [weekly-2026-W18.md](../docs/reports/weekly-2026-W18.md)

Last Updated: 2026-05-04
Latest Daily Report: [daily-2026-04-27.md](../docs/reports/daily-2026-04-27.md)

## Current Focus
**v1 retheme complete.** Every surface across the app — auth, sessions (active + list + retroactive), routines, progress, body, goals, exercises, settings — wears the new dark zinc + Bungee + lime/gold/kind-color design language. Real-device testing is still the only thing between trak and v1.

## Active Tasks
- [IN PROGRESS] Real-device validation pass
  - ⏭ iPhone — Safari + installed PWA via Add-to-Home-Screen
  - ⏭ Android — Chrome + installed PWA via Settings page install button
  - ⏭ Airplane-mode toggles while logging
  - ⏭ Cold-start from home screen (offline + online)
  - ⏭ Background ↔ foreground transitions
  - ⏭ Full update flow — deploy a new build, watch the banner, tap to refresh
- [LATER] Set `NPM_VERSION=11` env var on CF Pages project (one-time, prevents lockfile-format drift on future deploys)
- [LATER] Bundle size — Vite warns at 500kB; we're at 549kB minified / 165kB gzipped. Code-splitting could shave it but the spec didn't call for it

## Open Questions/Blockers
None

## Completed This Week
- [2026-05-04] **Full app retheme — v1 design language**
  - **Design system tokens** in `index.css` via Tailwind 4 `@theme` block. Surfaces: zinc cascade (bg → surface-1/2/3). Text: 6-step ramp (fg, fg-soft, fg-muted, fg-subtle, fg-faint, fg-disabled). Borders: line + line-strong (alpha-white). Action accent: lime. Kind colors: strength orange, cardio cyan, bodyweight violet. Body domain: rose. Achievement: gold (+ light + soft). Negative: danger red.
  - **Typography**: Bungee (display, page titles + hero numerics — caps via CSS `text-transform`), Hanken Grotesk (body), IBM Plex Mono (data/tabular). Loaded from Google Fonts. **Bungee Shade** reserved exclusively for achievement values (PR toasts + goal-hit). Bungee Inline loaded but currently unused.
  - **Color language committed: Option B (kind-anchored).** Colors carry semantic meaning, not decoration. Strength=orange, Cardio=cyan, Bodyweight=violet are anchored to the `kind` field on every exercise — appear on kind dots, set-row glow on completion, exercise progress chart lines. Body=rose for the Body domain page + chart. Gold for both PR and goal-achievement (universal "you did the thing" language). Lime is the universal action color (CTAs, focus rings, active nav, current week in frequency chart).
  - **Rejected directions explored**: Fraunces (too editorial / magazine-y for a gym app), Saira (genre-cliché for fitness), per-page accents (decorative wallpaper, no semantic meaning), Bungee Inline at hero size (didn't read as well as Regular).
  - **Three "earned drama" tiers visible app-wide**:
    1. Hero numerics (Bungee Regular at 6xl–7xl) — Body current weight, Active Session timer, Goal current/target
    2. Achievement values (Bungee Shade in toasts) — PR / goal celebration moments
    3. Kind-color glow on completed set rows + kind-color chart lines — domain-specific data
  - **Themed surfaces (every page)**:
    - Auth: `LoginPage`, `SignupPage` — big Bungee "trak" wordmark, themed forms with lime focus rings
    - Sessions: `SessionsListPage`, `SessionCard` (lime-tinted bg + pulsing dot + "LIVE" label for active sessions), `ActiveSessionPage` (hero timer in Bungee 6xl, lime "Finish" CTA), `SessionExerciseBlock` (kind dot + Bungee name), `SetRow` (kind-color soft bg + 3px solid stripe + kind-color check button when completed; lime ring in edit mode; mono numerics), `RestTimerBar` (lime progress bar), `RetroactiveSessionPage`
    - Routines: `RoutinesListPage`, `RoutineCard`, `RoutineDetailPage` (lime "Start" CTA, themed inline name/description edit), `RoutineExerciseBlock`, `PlannedSetsEditor` (mono numerics, lime ring on edit)
    - Progress: `ProgressPage` (gold-tinted hero stat cards + neutral small cards), `ExerciseProgressPage` (kind-colored chart line), `LineChart` (accepts color prop), `ChartAxis` + `ChartTooltip`, `MetricTabs` (dark pill with lime active), `PRCard` / `PRCardList` (gold uppercase labels)
    - Body: `BodyPage` (hero "Current weight" with Bungee 7xl + rose radial wash), `MetricCard`, `MetricDetailPage` (rose-colored chart line), `LogMeasurementSheet`
    - Goals: `GoalsListPage`, `GoalCard` (achievement state with gold border + soft radial wash + gold trophy pill), `GoalDetailPage` (kind-aware chart: lift=orange, body=rose, frequency=lime current week), `GoalFormPage`, `GoalTypePicker` (3-card lime active state)
    - Exercises: `ExerciseListPage`, `ExerciseCard` (kind dot + lime "Custom" badge), `ExerciseDetailPage`, `ExerciseFormPage`, `ExerciseForm` (kind picker with kind dots, muscle-group toggle chips), `KindFilter`, `MuscleGroupFilter`
    - Settings: `SettingsPage` (lime install CTA, sign-out hover toward danger), `SyncIssuesPage` (themed failed entries with retry/discard)
  - **Shared UI primitives themed**:
    - `BottomSheet` — added `maxWidth` prop so each call site matches its parent page's `max-w-*` on `md+`. Drag handle pill, drop shadow flipped upward, dark surface
    - `BottomNav` — dark glass pill, lime active indicator with glow shadow
    - `ConfirmDialog` — dark modal with backdrop blur, danger variant uses red, default variant uses lime CTA
    - `MeatballMenu` — dark dropdown with line-strong border
    - `EmptyState` — dashed-border dark card
    - `Toast` — added `"achievement"` variant: gold left stripe + radial wash + 32px gold glow shadow + Trophy icon + Bungee Shade value at 3xl. Used by both PR detection and goal-achievement (per design memory: gold = both). `"success"` variant has lime stripe + CheckCircle. `"default"` is neutral. Kept the sequential queue + visible stack + swipe-up-to-dismiss-all from before
    - `SyncIndicator` — failed=danger-soft, syncing=cardio-soft (cyan reads as "data in motion"), offline-pending=neutral
    - `UpdateBanner` — solid lime bar, micro uppercase tracking
    - `OfflineBanner` — amber tint (kept gold reserved for achievement, used raw amber values to avoid token sprawl)
    - `ExercisePicker` — search bar with lime focus, exercise rows with kind-color dots + Bungee names
    - `ActionMenuSheet` — dark themed with cardio/bodyweight accent dots on action icons
  - **`fg-soft` token added** mid-pass — zinc-300 (`#d4d4d8`). Slight dim for repeating Bungee text (exercise names in lists/blocks) so chunky strokes don't all compete at full white. Page titles + hero numerics stay at full `fg`.
- [2026-05-04] **Auth fix: cross-user data leak on shared device**
  - Logout previously only called `clearToken()` — left `localStore` + sync queue populated with the previous user's data. New user signing in inherited that data via UI (e.g. Progress page listed Emily's exercises for a fresh signup).
  - **Fix in two pieces**: (1) on logout, wipe `queue.clear()` + `localStore.clearAll()` + new `clearDataOwner()` + `clearToken()`. (2) On login/signup, track `trak.data.owner` localStorage key — if the new user.id differs from the previous owner, wipe data + queue; if it's the same user (token expired, re-login), preserve so offline writes survive. Handles all four cases: logout+same-user, logout+different-user, 401+same-user, 401+different-user.
  - New helpers in `authStorage.ts`: `getDataOwner` / `setDataOwner` / `clearDataOwner`. The owner key survives `clearToken` (required for the comparison on next login).
  - Trade-off documented in code: explicit logout drops any pending offline writes. We treat "log out" as "I'm done with this device."
- [2026-05-04] **Sign-out confirmation when there's pending sync**
  - Added `ConfirmDialog` flow on `SettingsPage` — if `pendingCount + failedCount > 0`, sign-out shows "X pending and Y failed updates haven't synced. They'll be discarded if you sign out now." with **Wait** / **Sign out** buttons (Sign out = danger variant). If counts are zero, signs out immediately.
  - Cancel label is "Wait" instead of "Cancel" — slightly more inviting toward the let-it-drain path. Confirm is the danger variant.
  - Only protects the manual sign-out path; 401-induced clears are silent (the token's invalid anyway, so pending work is orphaned).
- [2026-05-04] **Local Postgres moved to port 5435**
  - `jekyll_cms_db` (a different project's container) was squatting on port 5434, blocking `trak-pg` from restarting. Edited `docker-compose.yml`, `backend/config/database.yml` default, and `backend/config/application.yml` (Figaro env vars — the actual source of truth on Rails boot, overrides `database.yml` defaults). Saved a memory note about the three-file gotcha so it doesn't bite again.

## Next Session
Real-device testing pass. Then commit + push everything from today's retheme + auth fix + sign-out confirmation. After that passes, v1 is done.
