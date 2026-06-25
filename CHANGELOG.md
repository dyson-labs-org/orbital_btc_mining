# Changelog

## Unreleased

- Add the OP-3 controlled failure-recovery rehearsal with a committed recovery plan, deterministic validator, focused tests, and `.\eng.ps1 verify` integration.
- Record byte-for-byte rollback and recovery evidence under ignored `.agent-harness/artifacts/op-3-failure-recovery/`, with nondeterministic elapsed timing separated from deterministic reports.
- Refresh Orbital-local pilot documentation now that OP-1 and OP-2 are merged, while leaving OP-4 planned and v0.2 incomplete.
- Activate Orbital as the operational pilot and controlled test range for the provider-neutral harness.
- Consolidate active charter, safety, roadmap, and historical harness-evaluation records into canonical documents.
- Rename stale validators to `validate-operational-pilot.mjs` and `validate-active-tree-boundaries.mjs` while preserving deterministic product behavior.
- Keep C3-HARNESS-004 open / accepted_for_offline_v0.2 for local-only OP-0 through OP-4 work.

## Historical

- Isolated legacy source from active main while preserving it on `legacy/pre-orbital-compute-lab`.
- Added dependency-free Node.js status, resource-scenario validation, resource transitions, and scenario-suite regression orchestration.
