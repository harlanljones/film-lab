# Film Lab v1 browser quality gates

Captured 2026-08-23 against the production build served by Vite.

## Exact commands

```sh
bun run test
bun run test:e2e
bun run typecheck
bun run lint
bun run build
bun run dev --host 127.0.0.1
terminal-browser open http://127.0.0.1:5173/ --app-mode
bunx lighthouse http://127.0.0.1:5173/ --output=json --output-path=/tmp/film-lab-lighthouse.json --quiet
```

The automated suite completed with 30 tests passing. The production bundle is 223.18 kB JavaScript (70.00 kB gzip) and 3.20 kB CSS (1.27 kB gzip).
Lighthouse accessibility scored 0.95 (95/100) against the local production server.

## Browser evidence

- The browser accessibility snapshot exposed labelled Editor, Playbook, and Film Room regions, labelled navigation, labelled form controls, keyboard-reachable player/waypoint controls, and labelled playback controls.
- A follow-up DOM audit found 0 unlabeled `button`, `input`, or `select` controls and a document title of `Film Lab — 7-on-7 Playbook`.
- The page includes a `prefers-reduced-motion` fallback that disables nonessential animation and smooth scrolling.
- A repeatable playback fps harness (`bun run fps`, `scripts/fps-harness.mjs`) measured a 3-second
  1× sustained sample: 180 frames over 3,010.5 ms ≈ **59.8 fps** (artifact `docs/evidence/fps-report.json`).
  An earlier manual one-second sample recorded 61 rAF callbacks over 1,010.6 ms (~60.4 fps).
- Pointer editing, keyboard marker selection, save/reload persistence, playback controls, and invalid-edit recovery are covered by `src/e2e/editor-flow.test.tsx`.
