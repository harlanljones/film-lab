# Ported-suite parity — Film Lab vs scheme-db

Records the M0 porting basis and current parity for the metric row in `ROADMAP.md`.
Upstream: `harlanljones/scheme-db` (MIT), revision `174371e` (`2026-08-24` local checkout).

## Basis

Film Lab adapts scheme-db's engine mechanics and design tokens, NOT its 11v11 Play model,
NFL coaching taxonomy, or scheme data. Scope note: upstream test files that import scheme
data (`src/data/schemes/**`, `src/data/coaches/**`, `src/data/glossary`) cannot be ported
verbatim because those data layers were deliberately not transferred. Engine tests that
depend only on engine modules were ported and adapted to the 7v7 model.

## Upstream spec inventory (`src/engine/__tests__/`, rev `174371e`)

| Upstream spec | Ported? | Film Lab coverage |
|---|---|---|
| `beats.test.ts` | **Yes — ported & adapted** | `activeBeatIndex` covered in `src/engine/__tests__/engine.test.ts`; `isFocused` exported but not directly spec'd |
| `interpolate.test.ts` | **Partial — mechanics ported, fixtures scoped out** | `sampleTrack` ported (time-uniform Catmull-Rom) and covered in `engine.test.ts`; upstream `positionAt`/`getFullTrackSvgPath` and scheme-data fixtures dropped |
| `playback.test.ts` | **No — format diverges** | Upstream `formatTimecode` is `mm:ss.cc`; port emits `m:ss.s` (view layer `src/components/usePlayback.ts`). Pure clock `advancePlayback`/`clampPlaybackTime` spec'd in `src/engine/__tests__/playback.test.ts` |
| `validate.test.ts` | **Partial — ported & adapted** | `validatePlay` ported and tightened to 7v7 (7+7, sorted waypoints, t=0 anchor) in `src/engine/__tests__/domain.test.ts`; upstream `validateLibrary` scoped out |
| `coaches.test.ts` | **No — out of scope** | coaching trees/lineage not transferred (NFL taxonomy non-goal) |
| `glossary.test.ts` | **No — out of scope** | NFL glossary not transferred |
| `llm-seo.test.ts` | **No — out of scope** | robots/llms.txt/sitemap asset generation not in this app |
| `playpicker-playermarker.test.ts` | **No — adapted** | PlayerMarker aria-label logic rewritten in `src/components/Field7.tsx` with its own a11y tests; PlayPicker clusters not transferred |

## Result

- Ported-suite parity is **scoped to the ported engine modules**: beats, interpolate
  (mechanics), playback (pure clock), validate (7v7 subset).
- Every ported module is green within the Film Lab suite (`bun run test`, 33 tests as of
  2026-08-24) — see `ROADMAP.md` metrics.
- No upstream spec is silently dropped: the four out-of-scope specs above are recorded here
  with reasons, and no scheme/coach/glossary fixtures are required by any ported test.

## Re-audit

To re-verify against a future upstream revision: re-enumerate `__tests__/` at the new rev,
reclassify against this table, and confirm the ported modules' tests still pass. If an
upstream engine-mechanics change lands, port it or record the divergence here before closing.