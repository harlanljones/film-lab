# Film Lab

Film Lab is a local-first playbook for youth flag-football coaches. Create 7-on-7 plays from formation templates, edit routes, replay them in Film Room, and share individual plays through validated URL-hash links or JSON export. It has no server, account, or sync layer.

## Development

Requires Bun 1.x.

```sh
bun install
bun run dev
```

Quality gates: `bun run typecheck`, `bun run test`, `bun run lint`, and `bun run build`.

### Deploy

Production URL: **https://film-lab.harlanljones.com** (Cloudflare Workers Static Assets).

`bun run deploy` builds `dist/` and publishes it to Cloudflare Workers Static Assets
(`wrangler.jsonc`). This is hosting only — persistence stays in localStorage; there is no
backend, accounts, or sync.

Automated deploys run from `.github/workflows/deploy.yml` (push to `main` → production).
Before it will deploy, set two repository secrets in the GitHub repo (Settings →
Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — Cloudflare dashboard → My Profile → API Tokens → create a token
  from the "Edit Cloudflare Workers" template, scoped to your account and this script.
- `CLOUDFLARE_ACCOUNT_ID` — the account ID shown in the Cloudflare Workers dashboard sidebar.

Neither is ever committed (AGENTS.md §6). To deploy from your machine instead of CI, log in
once with `bunx wrangler login`, then `bun run deploy`. Pull requests also publish a unique
preview URL (`https://pr-<number>-film-lab.harlanljones.workers.dev`, via
`bunx wrangler versions upload --preview-alias pr-<number>`), posted as an in-place PR
comment and tagged with `?preview=<commit>` so the app shows a "Preview build — not
production" banner. Preview versions are not auto-expired — remove stale ones from the
Cloudflare dashboard.

## Coordinate system

The field is 40 yards wide and 40 yards deep. `x` increases across the field from 0 to 40; `y = 0` is the line of scrimmage and negative `y` points toward the offensive backfield. Field constants live in `src/engine/geometry.ts`.

## Animation model

Player routes use time-uniform Catmull-Rom interpolation through timed waypoints. The implementation does not use the centripetal parameterization claim from the upstream project; this app treats waypoint time as the source of truth and samples each segment uniformly in time.

## License

MIT. Ported engine mechanics retain attribution in their source headers.
