# ADR-0004: Resource Scenario Contract

Status: accepted for I1A incubation.

## Context

The lab needs deterministic resource inputs before it can safely design a
simulation kernel. The contract must be useful for tests without implying that
simulation, scheduling, Bitcoin, AI, telemetry, or mission behavior exists.

## Decision

Define `resource-scenario.v1` as a strict JSON contract using integer-only
resource accounting:

- Time uses milliseconds.
- Energy and toy thermal accounting use millijoules.
- Data capacity uses bytes.
- All numeric fields must be safe integers.
- Step indexes are zero-based and contiguous.
- No wall-clock time, randomness, implicit defaults, or unknown fields are used.

The contract is built before the kernel so the input boundary can be reviewed
independently and tested with deterministic fixtures.

## Consequences

The format is intentionally small and conservative. It cannot express workloads,
state transitions, or optimization decisions. That reduces accidental scope and
makes validation evidence easier to falsify.

Future changes require:

- a new or migrated schema version when compatibility is broken;
- fixtures covering old and new behavior;
- deterministic validator tests;
- review-packet evidence explaining why the format changed;
- explicit notes when scientific assumptions are still toy models.

## Rejected Options

- Floats: rejected because they add rounding and representation ambiguity.
- Wall-clock timestamps: rejected because validation output must be deterministic.
- Implicit defaults: rejected because they hide malformed input.
- Workload fields: rejected until workload and scheduler milestones define them.

