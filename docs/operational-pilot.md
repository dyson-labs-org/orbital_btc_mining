# Operational Pilot

Repository: `dyson-labs-org/orbital_btc_mining`

Classification: `operational_pilot`

Current milestone: `OP-4`

Status: `complete`

## Purpose

Orbital is the maintained real-repository pilot for the provider-neutral harness. The repository is a controlled local test range for task contracts, repository-owned verification, sanitized evidence, independent review, and rollback. The harness-side authority for pilot and release-gate status remains `agent-engineering-harness/docs/pilots/orbital.md`; this document describes Orbital-local execution and evidence surfaces.

## Active Maintenance

- Owner role: repo maintainers.
- PR review path: reviewed pilot branches before merge.
- Verification path: `.\eng.ps1 verify` plus task-specific checks.
- Triage path: separate pre-existing failures from pilot-introduced failures.
- Rollback path: branch revert, disposable repo-local state cleanup, and preserved legacy branch untouched.
- Evidence path: ignored `.agent-harness/artifacts/` roots and harness review packets.
- Escalation path: explicit authorization before live provider, credential, external service, canonical KB, production, financial, wallet, mining, or repository-admin operations.

## Controlled Test Range

Reviewed pilot branches may add or remove dependencies, rewrite product files, refactor local contracts and fixtures, add test doubles, inject failures, run destructive migrations against disposable repo-local state, exercise rollback and recovery, add or remove experimental capabilities, abandon a branch, or revert and replace prior pilot implementation.

Still prohibited without a later gate: secrets, tokens, live credentials, real payments, real mining, wallet material, billed services, production deployment, repository or organization administration, protected/default branch force-push, mutation of `legacy/pre-orbital-compute-lab`, canonical KB writes, live provider or adapter activation, hosted models, external services, and untrusted third-party execution.

## OP Sequence

| Step | Status | Gate |
| --- | --- | --- |
| OP-0 activation baseline | `complete` | docs consolidated, validators renamed, baseline captured, no unrelated product behavior change |
| OP-1 low-risk task | `complete` | strict `operational-status.v1` contract with task contract, local verification, installed-harness evidence, independent review, and rollback note |
| OP-2 meaningful product task | `complete` | deterministic `resource-trace-summary.v1` product increment without live external effects or transition/suite semantic changes |
| OP-3 failure recovery | `complete` | controlled failure, exact diagnosis, byte-for-byte rollback, recovery, commit-bound evidence, terminal independent review, and merge `51b32578056302069bca508a51194976c6ed43c7` |
| OP-4 retrospective and v0.3 decision | `complete` | local product-retention decision recorded as a mirror of the authoritative harness proposal |

OP-4 does not make Orbital a harness release-gate authority. The harness repository owns v0.2 closure and the v0.3 decision; this repository records the local execution and product-direction result.

## OP-3 Local Surface

OP-3 adds a committed recovery plan at `fixtures/recovery/op-3-failure-recovery-plan.v1.json` and a validator at `scripts/validate-op-3-failure-recovery.mjs`. The validator copies a known passing suite into `.agent-harness/tmp/op-3-failure-recovery/`, changes only that disposable copy so the real suite runner exits nonzero, diagnoses the exact expected `outcome_mismatch` and `constraint_codes_mismatch`, restores the original bytes and SHA-256, reruns successfully, and removes the disposable workspace in a finally path.

The deterministic report is written to `.agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-report.v1.json`. Nondeterministic rollback and recovery elapsed times are written separately to `.agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-timing.v1.json`.

Terminal OP-3 reviewed source: merge `51b32578056302069bca508a51194976c6ed43c7`, with the bounded process exception accepted by the harness in PR #16. The exception does not make the earlier OP-3 merges procedurally compliant; future work still requires independent review before merge.

## Local Retrospective Result

- R2 local controlled-test-range surface: `complete`. Status output, CLI behavior, validators, and verification consistently identify Orbital as a local controlled test range.
- R4 deterministic failure-state scenarios: `complete`. The reviewed OP-3 surface demonstrated controlled failure, diagnosis, rollback, recovery, containment, deterministic reporting, product-regression protection, integrity validation, and terminal scanning without live external effects.
- R5 local product-direction decision: `complete`. Orbital remains a maintained controlled offline test range. It preserves deterministic resource-accounting, regression, and recovery surfaces and does not automatically expand into a simulation product, mining product, wallet, trading system, telemetry product, networking product, hardware-control surface, or production service.

Future product expansion requires a separate reviewed charter. v0.2 completion does not imply live provider access, credentials, external services, canonical KB writes, or untrusted execution.

## Measurement

Track baseline status, task-contract completeness, verification results, evidence validity, review findings, rollback completeness, and counts of harness defects, product defects, documentation defects, and process friction. Record skipped and `not_run` claims explicitly. Do not infer precise elapsed or recovery durations from PR timestamps.

## Risks And Stop Conditions

Stop and re-plan if a task requires live credentials, mutates a protected/default branch, touches the preserved legacy branch, needs real financial or mining behavior, cannot separate pre-existing failures from pilot changes, leaks secrets or local absolute paths, or would require provider/adapter activation before the gate.

## C3-HARNESS-004

C3-HARNESS-004 status: `open / accepted_for_offline_v0.2`.

Owner: repo maintainers.

Effect: not a blocker for OP-0 through OP-4 while the work remains local, offline, credential-free, and free of live provider, external service, or untrusted third-party execution.

Closure is required before any live provider, credential, external service, canonical KB write, or untrusted third-party execution. Future closure evidence must include OS-enforced denial positive controls, OS-enforced denial negative controls, rollback evidence, and independent review.

Do not claim C3-HARNESS-004 is fixed, passed, or closed from OP-3 documentation or local-only pilot evidence.

## Project Configuration

No `.agent-harness/project.json` is required. No consumed schema exists in the harness, and OP-3 is covered by `AGENTS.md`, `eng.ps1`, task contracts, installed harness commands, and reviewed PR evidence. Future project configuration requires a consumer and a reviewed schema; no placeholder file is created here.
