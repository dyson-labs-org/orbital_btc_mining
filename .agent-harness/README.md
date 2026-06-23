# Agent Harness

This directory records the incubation task contract for Orbital Compute Lab.

I0 intentionally does not include `.agent-harness/project.json`. The gap is
tracked because the harness does not yet have a reviewed project schema for
incubation repositories in this repo.

Allowed I0 commands:

- `.\eng.ps1 bootstrap`
- `.\eng.ps1 verify`
- `node scripts/validate-incubation-charter.mjs`
- `node --test tests/incubation-charter.test.mjs`
- `git diff --check`

Legacy commands remain `not_run`.

## I0.5

I0.5 adds `.agent-harness/tasks/i0.5-clean-product-skeleton.task.json`.
Generated I0.5 evidence belongs under ignored `.agent-harness/artifacts/i0.5/`.
No `.agent-harness/project.json` is created because no reviewed incubation
project schema is available.
