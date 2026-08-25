# ROADMAP — Film Lab

## Current State

- **v1 is shipped** (closed 2026-08-23): 7v7 flag-play modeling, play Editor, film-room
  playback, playbook management, and URL-hash + JSON export/import. See
  `docs/quality-gates.md` for the browser evidence.
- Repo: git on `main`, 5 commits. `src/` is clean; `.codebase-memory/` index artifacts are
  tracked and churn on every reindex (F0.6 records the purge/reindex convention). No CLAUDE.md;
  there is no `src/views/` — the views live at `src/components/` (`EditorView.tsx`,
  `FilmRoom.tsx`, `PlaybookView.tsx`).
- Suite: `bun run test` = 30 tests / 10 files green; `bun run test:e2e` = 2 green
  (`src/e2e/editor-flow.test.tsx`). `bun run typecheck` and `bun run lint` are clean.
- Build (reproduced 2026-08-24): 223.18 kB JS / 70.00 kB gzip / 3.20 kB CSS (1.27 kB gzip).
- Browser gates: Lighthouse a11y 95/100; ~60.4 fps playback (61 rAF frames over 1,010.6 ms);
  `prefers-reduced-motion` fallback; 0 unlabeled controls.
- Engine determinism holds — no wall-clock or randomness anywhere in `src/engine/`. The
  React `usePlayback` rAF hook now lives in `src/components/usePlayback.ts` and calls the pure
  clock model in `src/engine/playback.ts` (D-1 fixed, Linear HJ-275).
- Starter library: 18/18 plays pass `isValidPlay` (sweep test
  `src/data/library/__tests__/sweep.test.ts`).
- All Film Lab Linear issues HJ-100..HJ-112 are Done; no open tickets in the Film Lab
  project (`docs/agents/issue-tracker.md`).
- codebase-memory graph index for this path is current and clean.
- Adopted upstream: harlanljones/scheme-db @ main (MIT). Its 11v11 Play model and NFL coach
  taxonomy did NOT transfer; engine mechanics (interpolate/beats/playback) and design tokens did.

## Objective

v1: a coach draws a 7v7 flag play from a formation template, animates it, organizes a local
playbook, and shares plays as JSON — starting from 18 starter plays (roster approved; per-user
direction recorded the coach reviewer as N/A, U3). **Achieved and shipped.**

## Scope / Non-goals

Non-goals: backend/accounts/multi-device sync · NFL content · coaching trees · disguise
matrix · native mobile · multi-league rule engines.

## Assumptions

- Bun ≥ 1.x present on dev machine — **verified** (v1 was built and shipped with it).
- Desktop browser primary; tablets tolerated; phones not targeted.
- Single execution stream: waves are ownership boundaries, not guaranteed parallelism.

## Decisions (all resolved)

| ID | Decision | Resolution | Gate |
|---|---|---|---|
| U1 | Undo depth | **Last-snapshot restore** — implemented as `undoSnapshot` in `src/engine/editor.ts`, covered by editor tests | D1 |
| U2 | Share via URL hash vs file-only export | **URL hash plus validated JSON fallback** — `src/storage/share.ts`, covered by `share.test.ts` | D3 |
| U3 | Coach reviewer availability for starter plays | Roster approved; **reviewer recorded as N/A per user direction** (Linear HJ-108) | D2 |

## Metrics

All v1 rows measured against the shipped build (evidence: `docs/quality-gates.md`, Linear
HJ-100..HJ-112, sweep test).

| Metric | Baseline | Target / Threshold | Result (measured) | Measurement | Owner | Cadence |
|---|---|---|---|---|---|---|
| Vitest suites passing | 0 (no repo) | 100% incl. library sweep (18/18 plays) | MET — 30/30 (10 files) + e2e 2/2 | `bun run test`, `bun run test:e2e` | Engine Steward | per wave |
| Ported-suite parity | upstream `__tests__/` enumerated at M0 | all ported specs green | MET — inventory + ported/scoped classification committed in `docs/parity.md` (rev `174371e`); ported engine modules (beats, interpolate mechanics, pure playback clock, validate 7v7 subset) green in the suite; 4 specs scoped out with reasons | `docs/parity.md` spec list vs upstream | Engine Steward | M0, re-audit on upstream rev change |
| Typecheck | n/a | strict-clean | MET | `bun run typecheck` | all | per wave |
| Initial bundle (gzip) | 71.6 kB JS gzip at HJ-302 baseline | ≤ 75 kB JS gzip + ≤ 2 kB CSS gzip, enforced by `bun run fps` | MET — 69.6 kB JS / 1.3 kB CSS gzip (gate-measured 2026-08-24; build log prints 72.1 via rolldown's estimator) | `bun run fps` (`docs/evidence/fps-report.json` `bundle` fields) | UI Steward | per release |
| Playback smoothness | harness at M2 | ≥ 55 fps sustained (3 s, 1×) | MET — 59.8 fps (180 frames / 3,010.5 ms, 2026-08-24) | `bun run fps` (`scripts/fps-harness.mjs`), artifact `docs/evidence/fps-report.json` | UI Steward | pre-ship |
| Lighthouse a11y | first run M6 | ≥ 95 | MET — 95/100 | Lighthouse CLI report artifact | UI Steward | pre-ship |
| Library integrity | 0 | 18/18 `validatePlay` pass | MET — 18/18 | sweep test | Content Author | on library change |

## Milestones — v1 (all executed)

All of M0–M7 below were completed and closed out 2026-08-23 (Linear HJ-100..HJ-112, all Done).
Milestones are kept as the executed plan; status notes carry the shipped evidence.

### M0 — Scaffold & Adoption — **COMPLETE**

Git repo initialized (5 commits on `main`); Vite+React19+TS-strict+Vitest+oxlint scaffold
with lockfile committed; command table verified against `package.json`; MIT LICENSE +
attribution-header convention; `interpolate/beats/playback` ported with tests; MCP index
purged & recreated.

Role: Engine Steward · Owns: root configs, `src/engine`. Deps: none.

**Exit met:** dev server serves app; ported suites green; command table verified.

### M1 — 7v7 Domain Core — **COMPLETE**

`src/engine/{types,validate,geometry}.ts` and `src/data/formations.ts` shipped; domain +
engine test suites green.

Role: Engine Steward · Owns: `src/engine/{types,validate,geometry}.ts`, formations. Deps: M0.

**Exit met:** suites green; property tests in `src/engine/__tests__/domain.test.ts` verify the
involutions `mirror(mirror(p)) === p` and `flip(flip(p)) === p`. (Original plan text wrote
`mirror(flip(m)) === m`, which is not the property under test and is false in general; the
committed tests are the ground truth.)

### M2 — Storage & Render Foundation — **COMPLETE**

- Storage: `playbookStore.ts` (schemaVersion 2, v1→v2 migration, backup-on-write, quota
  guard) · `usePlaybook` hook
- Render: `Field7/PlayerMarker/Trail` (40×40 SVG) · playback deck + clock in `FilmRoom.tsx`
  (no separate `PlaybackDeck` component) · fps numbers recorded.

Roles: Storage Steward / UI Steward (non-overlapping) · Deps: M1.

**Exit met:** sample play scrubs/loops; reload persists edits; fps recorded.

### M3 — Starter Library — **COMPLETE**

18 plays: 9 concepts (Mesh, Shallow, Flood, Levels, Snag, Stick, Slant-Flat, Spacing, Y-Cross)
× 2 defensive looks (Man 1-rush, Man 2-rush, Cover 2/3/4 across the roster), each with beats +
summary. **Note:** the original plan listed fast & tunnel screens; the shipped roster omits them
(see `src/data/library/index.ts`).

Role: Content Author · Owns: `src/data/library/`. Deps: M1.

**Exit met:** sweep 18/18; **D2 roster sign-off recorded (Linear HJ-108)**.

### M4 — Playbook View — **COMPLETE**

Thumbnails grid, filter/search, export single/all, import-merge with validation.

Role: UI Steward · Owns: `src/components/PlaybookView.tsx`, storage export API. Deps: M2, M3.

**Exit met:** round-trip test (export → wipe → import → deep-equal) passes.

### M5 — Editor (vertical slice → Gate D1) — **COMPLETE**

Formation palette; select/drag start spots; click-append waypoints + editable-t inspector;
trail/assignment pickers; beat editor; mirror/duplicate/rename/delete; validation hints;
last-snapshot undo (U1).

Owns: `src/components/EditorView.tsx` + editor components. Deps: M2 (M3 helps).

**Exit met:** scripted E2E (`src/e2e/editor-flow.test.tsx`) — template → edit routes → save →
replay in FilmRoom; hints fire on invalid states.

### M6 — Polish & A11y — **COMPLETE**

Full keyboard map; ARIA pass; error boundary; empty/error states; Lighthouse 95/100.

Role: UI Steward. Deps: M5. **Exit met:** LH report artifact ≥ 95.

### M7 — Docs & Ship Gate — **COMPLETE**

README/PRODUCT/DESIGN adapted; time-uniform Catmull-Rom documented accurately (did NOT
inherit upstream's centripetal claim); final integration; **D3 ship/no-ship passed** vs the
metric table.

## Dependency Graph & Waves (executed as drawn)

```
M0 → M1 ─┬─→ M2(storage ∥ M2 render) ─→ M5 → M6 → M7   ← critical path
         └─→ M3 (floats to D2) ────────→ M4 ↗
```

- W1 = M0 · W2 = M1 · W3 = storage track ∥ render track (distinct owners)
- W4 = M3 ∥ M4 prep · W5 = M5→M6→M7 serial (shared files)

Integration checkpoint after each wave: typecheck → test → sweep → tagged commit.

## Traceability

| Requirement / Concern | Covering work |
|---|---|
| Flag roles | F1.1, F1.2 |
| 40×40 geometry | F1.3, F2.3 |
| Local-first, versioned schema, export/import | F2.1, F2.2, M4 |
| Starter-play authenticity | M3 + D2 (U3) — roster approved; reviewer N/A per user direction |
| Honest spline documentation | M7 |
| A11y floor | Quality gates §5, M6 |
| Storage quota / rollback | F2.1 migrations + backup-on-write |
| Undo | M5 last-snapshot undo (U1 @ D1) |
| License attribution | F0.4, F0.5 |
| Test-port rot (11v11 fixtures) | parity metric scoped to interpolate/beats/playback only |

## Risks

| Risk | Trigger | Status / Mitigation |
|---|---|---|
| Waypoint-time UX fiddly | D1 slice feedback | auto-timed append first; editable-t demoted — handled at D1 |
| Plays judged inauthentic | D2 review | revise/cut; never ship unreviewed roster — roster approved (HJ-108), reviewer N/A per user direction |
| localStorage eviction/loss | observed data loss | backup-on-write implemented; **export reminders not implemented** and `store.error` is never surfaced in a view (F7) — escalate if observed |
| Dep drift (fresh scaffold, no upstream lockfile) | M0 install mismatch | pin majors; bun.lock committed — contained; watch on upgrades |
| Test-port rot | ported specs fail vs 7v7 model | parity scoped to ported engine files — all green (30-test suite) |
| Scope creep toward backend | feature requests | record under Decisions, defer past v1 — no backend deps added |

## Decision Gates (all resolved)

- **D1** (after editor vertical slice) — **resolved**: interaction model accepted; U1 = last-snapshot
  restore; bundle budget set on the measured 70.00 kB gzip base.
- **D2** (before M3 lock) — **resolved**: starter roster signed off in Linear HJ-108; U3 reviewer
  recorded as N/A per user direction.
- **D3** (pre-ship) — **resolved 2026-08-23**: ship against metric table; U2 = URL-hash sharing
  with validated JSON fallback. All v1 implementation and measured quality gates green; see
  `docs/quality-gates.md` for browser evidence, Lighthouse 95/100, ~60.4 fps, bundle size, and
  exact commands.

## Known deviations & follow-ups

Verified against `src/` on 2026-08-24; these are v1 gaps, not committed v2 scope.

| ID | Deviation | Evidence | Suggested fix |
|---|---|---|---|
| D-1 | ~~`src/engine/playback.ts` shipped React+rAF~~ — **FIXED** (Linear HJ-275): `usePlayback`/`formatTimecode` moved to `src/components/usePlayback.ts`; engine keeps the pure `advancePlayback`/`clampPlaybackTime` clock | | |
| D-2 | ~~Ported-parity baseline never recorded~~ — **FIXED** (Linear HJ-276): `docs/parity.md` commits the upstream inventory (rev `174371e`) with ported/scoped classification | | |
| D-3 | ~~No committed rAF harness; "sustained" fps & "reference laptop" undefined~~ — **FIXED** (Linear HJ-277): `scripts/fps-harness.mjs` measures a defined 3 s/1× sustained sample via `bun run fps`; artifact `docs/evidence/fps-report.json` (59.8 fps) | | |
| D-4 | ~~`store.error` never surfaced; export reminders not implemented~~ — **FIXED** (Linear HJ-278): `StorageAlert` renders `store.error` with `role="alert"` and a dismissible local-storage export reminder; wired into the app shell | | |
| D-5 | ~~`validateFormation` hardcoded field bounds~~ — **FIXED** (Linear HJ-279): uses `FIELD_WIDTH`/`FIELD_DEPTH` from `src/engine/geometry.ts`; no literal dimensions remain in `validate.ts` | | |
| D-6 | Starter roster omits screens the plan listed; reviewer N/A | library/index.ts vs M3 text | parked under P-C (library growth); requires a D2-style roster review |

## Next — v2 decision gate (P-B committed 2026-08-24)

v1 is shipped. **The v2 direction is committed: P-B — Film-room depth** (decision gate Q2,
Linear HJ-280). No v2 implementation ticket IDs exist yet; scope decomposes via the issue
tracker before work starts. Backend/accounts/sync stay out of scope regardless (AGENTS.md).

Open questions:

- **Q1 — Distribution trial:** **RESOLVED → run a real-season trial** (2026-08-24, Linear HJ-287):
  coach known personally, open timing, unstructured + short structured feedback, outcome bar =
  coach plans/runs one practice from the app. Corrections that surface flow through the library sweep.
- **Q2 — Direction:** **RESOLVED → P-B — Film-room depth** (2026-08-24, Linear HJ-280):
  scripted multi-play sequences, side-by-side compare, slow-mo/branch. Reuses shipped
  primitives (Field7, playback clock) and amplifies the core teaching loop. D-6 screens remain
  parked under P-C for a later decision; P-A/P-C/P-D stay as unselected candidates.
- **Q3 — Rule-model drift:** **RESOLVED → research complete** (2026-08-24, Linear HJ-286):
  `docs/research-rule-drift.md`. Concrete legality bug = rusher depth (rules require ≥ 7 yd;
  templates use y=4); exact 7+7 stricter than all rulebooks; 40×40 field matches no real field.
  No validation change shipped; recommended follow-ups (relax 7+7, rusher-depth validation,
  canvas relabel) are open decisions. Any rule change ships a migration + round-trip test
  (quality gate 4).

Candidate proposals (only P-B is committed):

- **P-A — Playbook power:** richer organization (folders/tags), import-merge UI, export surfaces.
- **P-B — Film-room depth — SELECTED:** scripted multi-play sequences, side-by-side compare,
  slow-mo/branch.
- **P-C — Library growth:** more formations/defenses and plays; requires a D2-style roster review
  (revisit U3 reviewer availability). Includes D-6 (screens).
- **P-D — Coach-review workflow:** file-based feedback exchange across coaches (no backend).