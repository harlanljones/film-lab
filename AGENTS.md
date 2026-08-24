# AGENTS.md — Film Lab

Instructions for development agents. Precedence: direct user instruction > this file > ROADMAP.md.

## Project Intent & Boundaries

- Film Lab is a LOCAL-FIRST web app for youth flag-football coaches to create, animate,
  organize, and share 7-on-7 plays. It adapts the engine and design system of
  github.com/harlanljones/scheme-db (MIT; retain attribution in ported files).
- In scope: flag 7v7 play modeling, play Editor, film-room playback, playbook management,
  JSON export/import.
- Out of scope: servers, accounts, sync, NFL content, native mobile. Do not add backend deps.
- ENGINE PURITY: `src/engine/` stays framework-free pure TypeScript — no React, no DOM,
  no `Date.now()`/`Math.random()`. Views consume engine results; engine never imports views.
- Field space: x ∈ [0, 40] yards wide, y = 0 at LOS, y negative toward offensive backfield.
  Dimensions live only in `src/engine/geometry.ts` constants — never hardcode in views.

## Architectural Ownership

| Path | Concern |
|---|---|
| `src/engine/*` | data model, interpolation, beats, playback, validation, geometry |
| `src/data/formations.ts` | offense/defense formation templates |
| `src/data/library/*` | starter plays — edit ONLY with library sweep rerun |
| `src/storage/*` | persistence, versioned schema, migrations, import/export |
| `src/components/*` | reusable SVG/UI primitives (Field7, PlayerMarker, Trail, PlaybackDeck) |
| `src/views/*` | EditorView, FilmRoomView, PlaybookView |

One writer per file/component at a time.

## Commands — PROPOSED UNTIL SCAFFOLD VERIFICATION (M0)

Verify against `package.json` at M0 and correct this table if they differ.

| Purpose | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` |
| Tests | `bun run test` |
| Typecheck | `bun run typecheck` |
| Lint | `bun run lint` |
| Build | `bun run build` |

## Quality Gates (all pass before integrating any wave)

1. Typecheck clean under `strict`; no `any` escapes (`unknown` + narrowing instead).
2. Full Vitest suite green, including the starter-library sweep test.
3. Engine determinism: no wall-clock or randomness in `src/engine/`.
4. Every persisted document carries `schemaVersion`; every schema change ships a migration
   plus a round-trip test.
5. A11y floor: ARIA labels on player tokens, timeline controls, and editor affordances;
   core actions keyboard-reachable.
6. No secrets in the repo (local-only app: none expected — keep it that way).
7. Ported upstream files keep MIT attribution headers.

## Prohibited Shortcuts

- No TODO/FIXME merged to main — open a ROADMAP item instead.
- Never touch `src/data/library/*` without rerunning the sweep test.
- Never weaken validation (7+7 counts, sorted waypoints, `t=0` anchor) to please fixtures.
- Do not widen scope (backend/auth/sync) without a user decision recorded in ROADMAP.md.

## Coordination Protocol

- Decompose in ROADMAP dependency order; claim exclusive file ownership before writing.
- Run independent items concurrently only where ownership does not overlap (waves W1–W5);
  serial execution is always safe.
- Integrate in dependency order. After every merge: typecheck → test → library sweep.
- Report progress against ROADMAP metrics (suite status, milestone exit criteria) — no
  vanity counts.

## Escalate to the user when

A command-table entry fails post-M0 · validation rules conflict with real flag rules ·
editor interaction model needs redesign (Gate D1) · storage quota/eviction observed.
