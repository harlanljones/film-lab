# Schema v4 bundles four additive concerns into one migration

---
status: accepted
date: 2026-08-24
---

v2 adds Practice Script rep metadata, an explicit `Play.concept`, per-play assignment
bindings, and a roster collection. Each alone would justify a schema bump; we decided to
ship all four as a single schemaVersion 4 migration instead of four chained bumps, because
every consumer (`playbookStore`, share/import/export, tests) pays a fixed cost per version
and the fields were all committed in the same grilling session. Rejected alternative:
per-feature migrations landing incrementally — lower speculation risk, but four rounds of
migration churn and four share-format compat windows for one feature wave.

## Consequences

- Migration chains run v1→v2→v3→v4; each step keeps its round-trip test (quality gate 4).
- `SCHEMA_VERSION` bumps in `share.ts` and `playbookStore.ts` must land in the same change.
- Single-play share links carry `concept` but never roster data; roster rides only the
  playbook document.
