# ADR-0005: Deterministic Resource Transitions

Status: accepted for incubation.

## Context

`resource-scenario.v1` defines deterministic environment inputs. I1B needs the
smallest transition engine that can exercise typed domain outcomes and harness
integrity tests without turning Orbital Compute Lab into an operational simulator.

## Decision

Implement a dependency-free transition engine over validated
`resource-scenario.v1` documents. The engine records battery and thermal state per
step, returns `completed` or `constraint_violation`, and keeps process failures
reserved for malformed input, invalid contracts, unsupported options, missing
files, arithmetic overflow, and unexpected internal errors.

## Rejected Options

- Floating-point resource accounting: rejected because deterministic safe-integer
  auditability matters more than physical modeling.
- Current-time dependence: rejected because repeated output must be stable.
- Unseeded randomness: rejected for the same reason.
- Implicit defaults: rejected because malformed inputs must remain visible.
- Silent arithmetic saturation: rejected unless the event is explicitly recorded,
  as with solar curtailment and thermal excess.
- Network-backed inputs: rejected because the evaluation must remain offline.
- Provider-generated decisions: rejected because no provider or adapter is needed
  for this vessel task.

## Consequences

The model remains intentionally narrow. Constraint violations are domain facts,
not command failures, which lets the harness distinguish negative domain outcomes
from process-level failures. The result is auditable but not a complete simulation
kernel and not a spacecraft thermal model.

## Compatibility

Future changes to the result schema require new fixtures, deterministic output
hashes, review evidence, and a migration note. Workload scheduling, queues,
Bitcoin, AI, profitability, telemetry, and operational behavior require separate
ADRs and evidence gates.
