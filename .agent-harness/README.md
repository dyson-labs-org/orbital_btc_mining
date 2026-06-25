# Agent Harness

This directory records Orbital task contracts and ignored evidence for the operational pilot.

OP-0 intentionally did not include `.agent-harness/project.json`. No consumed harness schema exists for this repository, so `AGENTS.md`, `eng.ps1`, task contracts, installed harness commands, and reviewed PR evidence are the active control surface.

Allowed local commands through OP-3 include:

- `.\eng.ps1 bootstrap`
- `.\eng.ps1 verify`
- `node scripts/validate-operational-pilot.mjs`
- `node scripts/validate-active-tree-boundaries.mjs`
- `node scripts/validate-operational-status.mjs`
- `node scripts/validate-resource-trace-summaries.mjs`
- `node scripts/validate-op-3-failure-recovery.mjs`
- `node --test`
- `git diff --check`

OP-3 failure recovery uses committed plan data under `fixtures/recovery/` and disposable execution state only under `.agent-harness/tmp/op-3-failure-recovery/`. Generated evidence belongs under ignored `.agent-harness/artifacts/` or `.agent-harness/tmp/` paths. Historical task contracts remain for provenance; active pilot status is defined by repository docs, current PR evidence, and the harness-side authority in `agent-engineering-harness/docs/pilots/orbital.md`.
