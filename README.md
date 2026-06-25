# Orbital Compute Lab

Orbital Compute Lab is the operational pilot and controlled test range for the provider-neutral Agent Engineering Harness. The active tree remains local, deterministic, and non-production while the pilot exercises task contracts, repository-owned verification, sanitized evidence, independent review, and rollback.

Status: operational pilot activation with deterministic resource-scenario validation, resource transitions, and scenario-suite regression orchestration.

Product stage: controlled test range.

Dependency installation: not required.

External service calls during verification: none.

The active product tree contains dependency-free Node.js product metadata, an honest status CLI, resource-scenario validation, a deterministic resource-transition engine, a scenario-suite runner, tests, and documentation. It does not implement a simulation kernel, scheduler, Bitcoin workload, AI workload, wallet, trading behavior, hosted AI behavior, network behavior, hardware control, production deployment, or mission authority.

## Golden Commands

```powershell
.\eng.ps1 bootstrap
.\eng.ps1 verify
node scripts/validate-operational-pilot.mjs
node scripts/validate-active-tree-boundaries.mjs
node --test
node src/cli.mjs status
node src/cli.mjs status --json
node src/cli.mjs run-suite fixtures/suites/core-resource-regression.v1.json --json
node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json
git diff --check
```

No package installation, legacy app command, server, live service probe, wallet, mining, payment, provider, adapter, or hosted model command is required for local verification.

## Status CLI

```powershell
node src/cli.mjs status
node src/cli.mjs status --json
node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json
node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json --json
node src/cli.mjs run-scenario fixtures/runs/nominal-resource-run.v1.json
node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json
node src/cli.mjs run-suite fixtures/suites/core-resource-regression.v1.json
node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json
node src/cli.mjs help
```

The CLI output is deterministic. It reports only the resource-scenario contract, validation, deterministic transition, and scenario-suite capabilities as implemented; simulation, scheduler, Bitcoin, AI, wallet, trading, network, hardware, and mission-authority capabilities remain false.

## Canonical Documents

- [Operational pilot](docs/operational-pilot.md)
- [Product roadmap](docs/roadmap.md)
- [Safety boundaries](docs/safety-boundaries.md)
- [Harness evaluation history](docs/history/harness-evaluations.md)
- [Legacy inventory](docs/legacy-inventory.md)
- [Legacy removal manifest](docs/legacy-removal-manifest.md)
- [Legacy source access](docs/legacy-source-access.md)
- [Audit report](docs/audit-report.md)
- [Research assumptions](docs/research-assumptions.md)
- [Resource scenario v1](docs/simulation/resource-scenario-v1.md)
- [Resource transition v1](docs/simulation/resource-transition-v1.md)
- [Scenario suite v1](docs/simulation/scenario-suite-v1.md)

Legacy source remains removed from active main and preserved on `legacy/pre-orbital-compute-lab` at `c93c7366edcd86b83896c3c39b753805183c3126` for read-only inspection.