# Orbital Compute Lab

Orbital Compute Lab is an incubation repository for offline, deterministic
study of constrained orbital resource allocation concepts.

Status: incubation skeleton with a deterministic resource-scenario contract.

The active product tree contains only dependency-free Node.js product metadata,
an honest status CLI, a resource-scenario contract validator, tests, and
documentation. It does not implement a simulation kernel, scheduler, Bitcoin
workload, AI workload, wallet, trading behavior, hosted AI behavior, network
behavior, hardware control, or mission authority.

## Current Status

- Incubation stage: I1A Deterministic Resource-Scenario Contract.
- Product implementation: skeleton.
- Resource-scenario contract: implemented for deterministic input validation.
- Legacy source: removed from active main and preserved on
  `legacy/pre-orbital-compute-lab`.
- Preserved legacy SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.
- Dependency installation: not required.
- External service calls during verification: none.
- I1 deterministic simulation kernel: not started.

## Status CLI

```powershell
node src/cli.mjs status
node src/cli.mjs status --json
node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json
node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json --json
node src/cli.mjs help
```

The CLI output is deterministic. It reports only the resource-scenario contract
and validation capabilities as implemented; simulation, scheduler, Bitcoin, AI,
wallet, trading, network, hardware, and mission-authority capabilities remain
false.

## Verification

Use the canonical wrapper:

```powershell
.\eng.ps1 bootstrap
.\eng.ps1 verify
```

`bootstrap` checks Git, PowerShell, Node.js 22 or newer, and legacy-source
documentation. `verify` runs only:

- `git diff --check`
- `node scripts/validate-incubation-charter.mjs`
- `node scripts/validate-clean-skeleton.mjs`
- `node scripts/validate-resource-scenarios.mjs`
- `node --test`
- `node src/cli.mjs status --json`
- representative valid and invalid `validate-scenario` CLI checks

No `npm install`, `npm ci`, `pnpm`, `npx`, package build, server, legacy app,
or external service is required.

## Legacy Source

Legacy source is not copied into a new active directory. Inspect it read-only
through Git when needed:

```powershell
git show legacy/pre-orbital-compute-lab:app.py
```

See [docs/legacy-source-access.md](docs/legacy-source-access.md).

## Key Documents

- [Product charter](docs/product-charter.md)
- [Safety boundaries](docs/safety-boundaries.md)
- [Legacy inventory](docs/legacy-inventory.md)
- [Legacy removal manifest](docs/legacy-removal-manifest.md)
- [Legacy source access](docs/legacy-source-access.md)
- [Audit report](docs/audit-report.md)
- [Research assumptions](docs/research-assumptions.md)
- [Verification plan](docs/verification-plan.md)
- [Roadmap](docs/roadmap.md)
- [Resource scenario v1](docs/simulation/resource-scenario-v1.md)
- [ADR-0001: Re-charter as Orbital Compute Lab](docs/architecture/ADR-0001-recharter-as-orbital-compute-lab.md)
- [ADR-0002: Deterministic offline-first](docs/architecture/ADR-0002-deterministic-offline-first.md)
- [ADR-0003: Node standard-library skeleton](docs/architecture/ADR-0003-node-standard-library-skeleton.md)
- [ADR-0004: Resource Scenario Contract](docs/architecture/ADR-0004-resource-scenario-contract.md)
