# Operational Pilot

Repository: `dyson-labs-org/orbital_btc_mining`

Classification: `operational_pilot`

Current milestone: `OP-0`

Status: `activation_in_progress`

## Purpose

Orbital is the maintained real-repository pilot for the provider-neutral harness. OP-0 activates the repository as a controlled test range, consolidates active documentation, captures a baseline, and avoids unrelated product behavior changes.

## Active Maintenance

- Owner role: repo maintainers.
- PR review path: reviewed pilot branches before merge.
- Verification path: `.\eng.ps1 verify` plus task-specific checks.
- Triage path: separate pre-existing failures from pilot-introduced failures.
- Rollback path: branch revert, disposable repo-local state cleanup, and preserved legacy branch untouched.
- Evidence path: ignored `.agent-harness/artifacts/operational-pilot-activation/` and harness review packets.
- Escalation path: explicit authorization before live provider, credential, external service, canonical KB, production, financial, wallet, mining, or repository-admin operations.

## Controlled Test Range

Reviewed pilot branches may add or remove dependencies, rewrite product files, refactor local contracts and fixtures, add test doubles, inject failures, run destructive migrations against disposable repo-local state, exercise rollback and recovery, add or remove experimental capabilities, abandon a branch, or revert and replace prior pilot implementation.

Still prohibited without a later gate: secrets, tokens, live credentials, real payments, real mining, wallet material, billed services, production deployment, repository or organization administration, protected/default branch force-push, mutation of `legacy/pre-orbital-compute-lab`, canonical KB writes, live provider or adapter activation, hosted models, external services, and untrusted third-party execution.

## OP Sequence

| Step | Status | Gate |
| --- | --- | --- |
| OP-0 activation baseline | `in_progress` | docs consolidated, validators renamed, baseline captured, no unrelated product behavior change |
| OP-1 low-risk task | `planned` | task contract, local verification, sanitized evidence, independent review, rollback note |
| OP-2 meaningful product task | `planned` | representative deterministic product increment without live external effects |
| OP-3 failure recovery | `planned` | controlled failure, diagnosis, rollback, and evidence |
| OP-4 retrospective and v0.3 decision | `planned` | adoption findings, remaining risks, release-gate recommendation |

## Measurement

Track baseline status, task-contract completeness, verification results, evidence validity, review findings, rollback completeness, elapsed time from task start to reviewed evidence, and counts of harness defects, product defects, documentation defects, and process friction. Record skipped and `not_run` claims explicitly.

## Risks And Stop Conditions

Stop and re-plan if a task requires live credentials, mutates a protected/default branch, touches the preserved legacy branch, needs real financial or mining behavior, cannot separate pre-existing failures from pilot changes, leaks secrets or local absolute paths, or would require provider/adapter activation before the gate.

## C3-HARNESS-004

C3-HARNESS-004 status: `open / accepted_for_offline_v0.2`.

Owner: repo maintainers.

Effect: not a blocker for OP-0 through OP-4 while the work remains local, offline, credential-free, and free of live provider, external service, or untrusted third-party execution.

Closure is required before any live provider, credential, external service, canonical KB write, or untrusted third-party execution. Future closure evidence must include OS-enforced denial positive controls, OS-enforced denial negative controls, rollback evidence, and independent review.

Do not claim C3-HARNESS-004 is fixed, passed, or closed from OP-0 documentation or local-only pilot evidence.

## Project Configuration

No `.agent-harness/project.json` is required for OP-0. No consumed schema exists in the harness, and OP-0 is covered by `AGENTS.md`, `eng.ps1`, task contracts, installed harness commands, and reviewed PR evidence. Future project configuration requires a consumer and a reviewed schema; no placeholder file is created here.