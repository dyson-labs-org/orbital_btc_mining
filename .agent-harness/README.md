# Agent Harness

This directory records Orbital task contracts and ignored evidence for the operational pilot.

OP-0 intentionally does not include `.agent-harness/project.json`. No consumed harness schema exists for this repository, so `AGENTS.md`, `eng.ps1`, task contracts, installed harness commands, and reviewed PR evidence are the active control surface.

Allowed OP-0, OP-1, and OP-2 local commands include:

- `.\eng.ps1 bootstrap`
- `.\eng.ps1 verify`
- `node scripts/validate-operational-pilot.mjs`
- `node scripts/validate-active-tree-boundaries.mjs`
- `node scripts/validate-operational-status.mjs`
- `node scripts/validate-resource-trace-summaries.mjs`
- `node --test`
- `git diff --check`

Generated evidence belongs under ignored `.agent-harness/artifacts/` or `.agent-harness/tmp/` paths. Historical task contracts remain for provenance; active pilot status is defined by repository docs and current PR evidence.
