# Roadmap

Orbital Compute Lab is a controlled test range for deterministic, offline resource-accounting product work. This roadmap tracks product capability only; the pilot charter lives in [docs/operational-pilot.md](operational-pilot.md).

## Current Product Stage

Status: `controlled_test_range`

Implemented capabilities:

- `resource-scenario.v1` validation;
- deterministic resource-transition outcomes;
- `scenario-suite.v1` regression orchestration;
- `resource-trace-summary.v1` deterministic trace summaries;
- deterministic status and CLI output;
- dependency-free local verification.

Not implemented: simulation kernel, workload scheduler, profitability model, Bitcoin workload, AI workload, wallet, trading, telemetry, external network behavior, hardware control, production deployment, and mission authority.

## Capability Sequence

### R0 - Legacy Preservation

Status: complete

Outcome: legacy source is removed from active main and preserved on `legacy/pre-orbital-compute-lab` at `c93c7366edcd86b83896c3c39b753805183c3126` for read-only inspection.

### R1 - Deterministic Resource Contracts

Status: complete

Outcome: `resource-scenario.v1`, resource-transition results, and scenario-suite fixtures validate deterministic local behavior without external calls.

### R2 - Controlled Test Range Surface

Status: in_progress

Outcome: status output, CLI behavior, and verification surfaces consistently expose Orbital as a controlled local test range with deterministic resource-accounting capability only.

### R3 - Next Meaningful Product Increment

Status: complete

Outcome: added deterministic resource-trace summaries over existing transition results without live external effects or transition semantic changes.

Exit gate: committed deterministic summary fixtures, `.\eng.ps1 verify`, and reviewed evidence identifying the resource-trace-summary capability and changed product surfaces.

### R4 - Deterministic Failure-State Scenarios

Status: planned

Outcome: add local fixtures that model recoverable resource deficits, constraint failures, and state reconciliation without external effects.

### R5 - Product Direction Decision

Status: planned

Outcome: decide whether to continue toward a larger local simulation product, archive the lab, or re-scope it after the operational-pilot retrospective.

## Capability Boundaries

Product capability claims require committed implementation, local tests, `.\eng.ps1 verify`, and reviewed evidence. This roadmap does not authorize live provider access, production deployment, real mining, payments, wallets, direct databases, canonical KB writes, or mutation of the preserved legacy branch.
