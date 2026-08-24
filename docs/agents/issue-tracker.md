# Issue tracker: Linear

Issues and specs for this repo live in **Linear**.

## Command and scope

- Command: `linear`
- Workspace: `harlanljones`
- Team: `HJ`
- Project: `Film Lab` (`3b0c34e1c5ec`)

Run the command's `--version` and `--help` once at the start of a tracker session. The installed CLI's help is authoritative. If it is unavailable, do not substitute GitHub issues, local markdown, or direct API calls; report the setup gap and continue work that does not need the tracker.

Credentials load from chezmoi-managed `~/.linear.toml` via the standard `LINEAR_API_KEY` loader; never print or store the token.

## States and labels

Linear workflow states and labels are separate. Canonical triage roles such as `ready-for-agent` are labels; applying one does not move workflow state unless the invoking skill says to.

The triage label mapping lives in `docs/agents/triage-labels.md` when triage is installed.

## Common operations

- Create: `linear issue create --no-interactive --team HJ --title "..." --description-file <path>`
- Read: `linear issue view [ID] --json --no-download`
- Query: `linear issue query --team HJ --all-states --all-assignees --json`
- Comment: `linear issue comment add [ID] --body-file <path>`
- Incremental labels: `linear issue update [ID] --add-label "..."` / `--remove-label "..."`
- Claim: `linear issue update [ID] --assignee self`
- Complete: `linear issue update [ID] --state completed`

Use Markdown files for multi-line descriptions and comments (temp files outside the repo). Never print or store the API token in the repository.

## Wayfinding operations

Used by `wayfinder`. The map is a Linear issue labelled `wayfinder:map`; its decision tickets are native child issues created with `--parent [MAP-ID]` and labelled `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`.

- Blocking: native Linear issue relations, e.g. `linear issue relation add [BLOCKED] blocked-by [BLOCKER]`.
- Frontier: open, unassigned child issues whose native relations contain no open blocker. Query a bounded issue set as JSON, filter by parent, then inspect relations for candidates.
- Claim: re-check the candidate, then `linear issue update [ID] --assignee self` as the first write.
- Resolve: add the answer as a resolution comment, move the child to the completed state, then merge a one-line linked gist into the map's `Decisions so far` section without overwriting concurrent edits.

Refer to issues by linked title in prose, not bare identifiers.

## Pull requests as a triage surface

**PRs as a request surface: no.** This is a local-first repo without a shared remote; reference Linear issues by full identifier.
