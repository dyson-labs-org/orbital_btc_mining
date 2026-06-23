# Orbital Compute Lab

Orbital Compute Lab is an incubation repository for offline, deterministic study
of orbital compute concepts. The current milestone re-charters the repository
away from an operational "orbital BTC mining" web app and into a safety-first
research lab.

This repository is not production software, not an active mining service, and
not authorized to call external services during harness verification. Legacy
source files remain in the tree for auditability only until future milestones
replace them with deterministic simulation components.

## Current Status

- Incubation stage: I0 Audit/Re-charter.
- Product implementation: not_started.
- Legacy application commands: not_run for this milestone.
- External service calls during verification: none.
- Baseline preserved at `legacy/pre-orbital-compute-lab`.
- Baseline SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.

## Safety Boundary

Allowed work in this repository is limited to documentation, deterministic
offline validators, and future simulation code that can run without credentials,
network calls, package installation, deployed services, or provider state
changes.

Do not run the legacy Flask app, Render deployment commands, Google Sheets or
email helper scripts, package installs, or auto-commit helpers as part of this
incubation milestone. See [docs/safety-boundaries.md](docs/safety-boundaries.md).

## Verification

The harness entry point is intentionally small:

```powershell
.\eng.ps1 bootstrap
.\eng.ps1 verify
```

`bootstrap` performs no network calls, creates no artifacts, installs no
packages, and runs no legacy commands. `verify` is limited to:

- `git diff --check`
- `node scripts/validate-incubation-charter.mjs`
- `node --test tests/incubation-charter.test.mjs`

## Key Documents

- [Product charter](docs/product-charter.md)
- [Safety boundaries](docs/safety-boundaries.md)
- [Legacy inventory](docs/legacy-inventory.md)
- [Audit report](docs/audit-report.md)
- [Research assumptions](docs/research-assumptions.md)
- [Verification plan](docs/verification-plan.md)
- [Roadmap](docs/roadmap.md)
- [ADR-0001: Re-charter as Orbital Compute Lab](docs/architecture/ADR-0001-recharter-as-orbital-compute-lab.md)
- [ADR-0002: Deterministic offline-first](docs/architecture/ADR-0002-deterministic-offline-first.md)

The previous `readme.txt` is retained as legacy evidence and is superseded by
this README for current repository intent.
