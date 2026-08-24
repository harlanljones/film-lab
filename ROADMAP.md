# ROADMAP — Film Lab

## Current State

- Working directory was empty at planning time (verified); no git repo, no package.json yet.
  Git init approved as roadmap work (F0.1).
- Stale codebase-memory index exists for this path (2 phantom nodes) — delete & reindex at M0.
- Adopted upstream: harlanljones/scheme-db @ main (MIT). Its 11v11 Play model and NFL coach
  taxonomy do NOT transfer; engine mechanics and design tokens do.

## Objective

v1: a coach draws a 7v7 flag play from a formation template, animates it, organizes a local
playbook, and shares plays as JSON — starting from ~18 reviewed starter plays.

## Scope / Non-goals

Non-goals: backend/accounts/multi-device sync · NFL content · coaching trees · disguise
matrix · native mobile · multi-league rule engines.

## Assumptions

- Bun ≥ 1.x present on dev machine (verify M0; document npm fallback if absent).
- Desktop browser primary; tablets tolerated; phones not targeted.
- Single execution stream: waves are ownership boundaries, not guaranteed parallelism.

## Unresolved Decisions

| ID | Decision | Why it matters | Gate |
|---|---|---|---|
| U1 | Undo depth (default: last-snapshot restore) | Editor trust | D1 |
| U2 | Share via URL hash vs file-only export | Resolved: URL hash plus JSON fallback | D3 |
| U3 | Coach reviewer availability for starter plays | Resolved: roster approved; reviewer recorded as N/A per user direction | D2 |

## Metrics

| Metric | Baseline | Target / Threshold | Measurement | Owner | Cadence |
|---|---|---|---|---|---|
| Vitest suites passing | 0 (no repo) | 100% incl. library sweep (18/18 plays) | `bun run test` | Engine Steward | per wave |
| Ported-suite parity | TBD — enumerate upstream `__tests__/` at M0 | all ported specs green | spec-list diff vs upstream | Engine Steward | M0 |
| Typecheck | n/a | strict-clean | `bun run typecheck` | all | per wave |
| Initial bundle (gzip) | TBD — record at M0 build | budget fixed at D1 from measured base | `bun run build` output | UI Steward | per release |
| Playback smoothness | TBD — harness at M2 | ≥ 55 fps sustained, 1× loop, reference laptop | rAF-delta dev harness | UI Steward | M2, M6 |
| Lighthouse a11y | TBD — first run M6 | ≥ 95 | Lighthouse CLI report artifact | UI Steward | pre-ship |
| Library integrity | 0 | 18/18 `validatePlay` pass | sweep test | Content Author | on library change |

## Milestones

### M0 — Scaffold & Adoption

Purpose: runnable skeleton, honest licensing, verified commands.

- F0.1 `git init` + `.gitignore`
- F0.2 Vite+React19+TS-strict+Vitest+oxlint scaffold; commit lockfile immediately
- F0.3 verify/correct AGENTS command table against `package.json`
- F0.4 MIT LICENSE + attribution-header convention
- F0.5 port `interpolate/beats/playback` + their tests (attribution headers)
- F0.6 purge & recreate MCP index for this path

Role: Engine Steward · Owns: root configs, `src/engine`. Deps: none.

**Exit:** dev server serves placeholder; ported suites pass; command table verified.

### M1 — 7v7 Domain Core

- F1.1 `types.ts` (roles qb|c|rb|wr|slot / rusher|lb|db|s; category, defenseLook, tags,
  notes; keep beats+summary; drop coach/family/sequence)
- F1.2 `validate.ts` (exactly 7+7, sorted waypoints, first t=0, trail enum)
- F1.3 `geometry.ts` (field constants, mirror/flip)
- F1.4 `formations.ts` templates
- F1.5 validate+geometry test suites

Role: Engine Steward · Owns: `src/engine/{types,validate,geometry}.ts`, formations. Deps: M0.

**Exit:** suites green; property test `mirror(flip(m)) === m` passes.

### M2 — Storage & Render Foundation (two tracks)

- Storage track: F2.1 `playbookStore.ts` (schemaVersion, migrations, backup-on-write,
  quota guard) · F2.2 `usePlaybook` hook
- Render track: F2.3 `Field7/PlayerMarker/Trail` (40×40 SVG) · F2.4 `PlaybackDeck` +
  clock · F2.5 `FilmRoomView` reading store · F2.6 rAF-fps harness

Roles: Storage Steward / UI Steward (non-overlapping) · Deps: M1.

**Exit:** sample play scrubs/loops at speeds; reload persists edits; fps numbers recorded.

### M3 — Starter Library (floats until D2)

~18 plays: Mesh, Shallow, Flood, Levels, Snag, Stick, Slant-Flat, Spacing, Y-Cross, fast &
tunnel screens × Man 1-rush, Man 2-rush, Cover 2/3/4 — each with beats + summary.

Role: Content Author · Owns: `src/data/library/`. Deps: M1 (render helps eyeballing).

**Exit:** sweep 18/18; **D2 roster sign-off recorded before lock**.

### M4 — Playbook View

Thumbnails grid, filter/search, export single/all, import-merge with validation.

Role: UI Steward · Owns: `views/PlaybookView`, storage export API. Deps: M2, M3.

**Exit:** round-trip test (export → wipe → import → deep-equal) passes.

### M5 — Editor (vertical slice FIRST → Gate D1)

Formation palette; select/drag start spots; click-append waypoints + editable-t inspector;
trail/assignment pickers; beat editor; mirror/duplicate/rename/delete; validation hints;
last-snapshot undo (U1).

Owns: `views/EditorView` + editor components. Deps: M2 (M3 helps).

**Exit:** scripted E2E — template → edit routes → save → replay in FilmRoom; hints fire on
invalid states.

### M6 — Polish & A11y

Full keyboard map; ARIA pass; error boundary; empty/error states; Lighthouse ≥95.

Role: UI Steward. Deps: M5. **Exit:** LH report artifact ≥95.

### M7 — Docs & Ship Gate

README/PRODUCT/DESIGN adapted; document time-uniform Catmull-Rom accurately (do NOT inherit
upstream's centripetal claim); final integration; **D3 ship/no-ship** vs metric table.

## Dependency Graph & Waves

```
M0 → M1 ─┬─→ M2(storage ∥ M2 render) ─→ M5 → M6 → M7   ← critical path
         └─→ M3 (floats to D2) ────────→ M4 ↗
```

- W1 = M0
- W2 = M1
- W3 = storage track ∥ render track (distinct owners)
- W4 = M3 ∥ M4 prep
- W5 = M5→M6→M7 serial (shared files)

Integration checkpoint after each wave: typecheck → test → sweep → tagged commit.

## Traceability

| Requirement / Concern | Covering work |
|---|---|
| Flag roles | F1.1, F1.2 |
| 40×40 geometry | F1.3, F2.3 |
| Local-first, versioned schema, export/import | F2.1, F2.2, M4 |
| Starter-play authenticity | M3 + D2 (U3) |
| Honest spline documentation | M7 |
| A11y floor | Quality gates §5, M6 |
| Storage quota / rollback | F2.1 migrations + backup-on-write |
| Undo | F5 undo (U1 @ D1) |
| License attribution | F0.4, F0.5 |
| Test-port rot (11v11 fixtures) | parity metric scoped to interpolate/beats/playback only |

## Risks

| Risk | Trigger | Mitigation |
|---|---|---|
| Waypoint-time UX fiddly | D1 slice feedback | auto-timed append first; editable-t demoted |
| Plays judged inauthentic | D2 review | revise/cut; never ship unreviewed roster |
| localStorage eviction/loss | observed data loss | backup-on-write + export reminders |
| Dep drift (fresh scaffold, no upstream lockfile) | M0 install mismatch | pin majors; commit bun.lock at F0.2 |
| Test-port rot | ported specs fail vs 7v7 model | parity scoped to ported engine files |
| Scope creep toward backend | feature requests | record under Unresolved, defer past v1 |

## Decision Gates

- **D1** (after editor vertical slice): interaction model + undo depth (U1) + bundle budget.
- **D2** (before M3 lock): coach sign-off on starter roster (U3).
- **D3** (pre-ship): ship/no-ship against metric table; resolve U2.

## D3 status

All v1 implementation and measured quality gates are green as of 2026-08-23. U2 is resolved to URL-hash sharing with validated JSON fallback; D2 roster approval is recorded in Linear HJ-108. See `docs/quality-gates.md` for browser evidence, Lighthouse 95/100 accessibility, ~60.4 fps playback, bundle size, and exact commands.
