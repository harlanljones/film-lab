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
- A one-second active playback sample produced 61 requestAnimationFrame callbacks over 1,010.6 ms (about 60.4 fps), with the timeline advancing to the one-second endpoint.
- Pointer editing, keyboard marker selection, save/reload persistence, playback controls, and invalid-edit recovery are covered by `src/e2e/editor-flow.test.tsx`.
