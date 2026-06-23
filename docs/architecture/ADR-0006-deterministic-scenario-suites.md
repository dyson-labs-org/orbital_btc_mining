# ADR-0006: Deterministic Scenario Suites

Status: accepted.

## Context

I1B introduced deterministic resource transitions for individual
`resource-scenario.v1` files. Cycle 3 needs a small product vessel that exercises
the harness without expanding Orbital into scheduling, workload execution, or
operational behavior.

## Decision

Add `scenario-suite.v1`, a strict deterministic contract for ordered regression
suites over existing resource-transition scenarios. The runner accepts explicit
repository-relative paths under `fixtures/runs/`, executes each referenced
scenario with the existing transition engine, and compares actual outcomes with
declared expectations.

The runner treats expected `constraint_violation` outcomes as successful suite
cases. It treats expectation mismatches as command failures.

## Consequences

- Regression orchestration is explicit and repeatable.
- Constraint-domain outcomes remain distinct from process failures.
- No dynamic fixture discovery, network behavior, providers, adapters,
  subprocesses, randomness, wall-clock fields, dependencies, or lockfiles are
  introduced.
- The feature does not implement a scheduler, optimizer, Bitcoin workload, AI
  workload, telemetry system, hardware controller, mission planner, or simulation
  kernel completion.
- Scientific claims remain limited to deterministic fixture execution.
