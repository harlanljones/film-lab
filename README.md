# Film Lab

Film Lab is a local-first playbook for youth flag-football coaches. Create 7-on-7 plays from formation templates, edit routes, replay them in Film Room, and share individual plays through validated URL-hash links or JSON export. It has no server, account, or sync layer.

## Development

Requires Bun 1.x.

```sh
bun install
bun run dev
```

Quality gates: `bun run typecheck`, `bun run test`, `bun run lint`, and `bun run build`.

## Coordinate system

The field is 40 yards wide and 40 yards deep. `x` increases across the field from 0 to 40; `y = 0` is the line of scrimmage and negative `y` points toward the offensive backfield. Field constants live in `src/engine/geometry.ts`.

## Animation model

Player routes use time-uniform Catmull-Rom interpolation through timed waypoints. The implementation does not use the centripetal parameterization claim from the upstream project; this app treats waypoint time as the source of truth and samples each segment uniformly in time.

## License

MIT. Ported engine mechanics retain attribution in their source headers.
