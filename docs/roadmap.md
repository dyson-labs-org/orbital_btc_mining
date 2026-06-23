# Roadmap

Orbital Compute Lab advances through incubation gates. Passing one gate does not
imply operational readiness.

## I0 - Audit/Re-charter

Status: merged.

Outcome: preserved the legacy baseline, documented risks, defined the product
charter, added safety boundaries, established harness verification, and kept
legacy runtime commands `not_run`.

Exit gate: local charter validator and harness checks passed before merge.

## I0.5 - Legacy Isolation and Clean Product Skeleton

Status: complete.

Outcome: removed legacy implementation from active main while preserving it on
`legacy/pre-orbital-compute-lab`, add a dependency-free Node.js skeleton, expose
an honest deterministic status CLI, and verify offline on Windows and Ubuntu.

Exit criteria:

- legacy source preserved by immutable branch reference;
- legacy implementation absent from active product tree;
- clean dependency-free package skeleton;
- deterministic status CLI;
- offline Windows and Ubuntu verification;
- no external service;
- no product behavior beyond metadata/status;
- independent large-deletion review;
- CI passing;
- human approval and merge.

## I1 - Deterministic Simulation Kernel

Status: not_started.

Outcome: introduce a minimal offline simulation kernel with deterministic input
fixtures, expected outputs, and uncertainty notes.

Exit gate: repeatable tests verify kernel behavior without external calls.

### I1A - Deterministic Resource-Scenario Contract

Status: complete.

Outcome: define `resource-scenario.v1`, deterministic fixture validation, and a
CLI validation surface for future simulation inputs.

Boundary: I1A does not implement the simulation kernel, scheduler, Bitcoin
workloads, AI workloads, telemetry, orbital propagation, optimization, wallet
behavior, network behavior, hardware control, or mission authority.

Exit gate: local verification and review packet evidence show deterministic
validation, honest status metadata, expected-negative fixtures, no dependencies,
and no provider or adapter requirement.

### I1B - Deterministic Resource Transitions

Status: complete.

Outcome: run validated `resource-scenario.v1` inputs through deterministic
electrical and thermal resource transitions with typed `completed` and
`constraint_violation` domain outcomes.

Boundary: I1B does not implement the full simulation kernel, scheduler, Bitcoin
workloads, AI workloads, profitability, optimization, telemetry, orbital
propagation, wallet behavior, network behavior, provider behavior, hardware
control, or mission authority.

Exit gate: local verification and harness evidence show deterministic transition
results, domain-negative outcomes distinct from process failures, redaction,
tamper, stale-binding, reproducibility, candidate-lifecycle, and review-packet
checks without dependencies, provider, adapter, or network requirement.

### I1C - Deterministic Scenario Suites

Status: in_progress_pending_merge.

Outcome: define `scenario-suite.v1` and a deterministic runner that executes
existing resource-transition scenarios in declared order and compares domain
outcomes with explicit expectations.

Boundary: I1C does not implement the full simulation kernel, scheduler, Bitcoin
workloads, AI workloads, profitability, optimization, telemetry, orbital
propagation, wallet behavior, network behavior, provider behavior, hardware
control, or mission authority.

Exit gate: local verification and harness evidence show deterministic suite
execution, expected constraint outcomes, expectation-mismatch failures,
integrity validation, relocation, tamper and missing-artifact detection,
target-mutation detection, review-bundle validation, and stale-binding checks
without dependencies, provider, adapter, KB, or network requirement.

## I2 - Workload/Scheduler

Status: not_started.

Outcome: model workload windows, power limits, thermal limits, and scheduling
decisions without provider integrations.

Exit gate: scheduler fixtures cover nominal, constrained, and infeasible cases.

## I3 - Explainability/Telemetry

Status: not_started.

Outcome: produce explainable traces for assumptions, intermediate values,
warnings, and confidence limits.

Exit gate: every user-visible result can be traced to fixture inputs and model
steps.

## I4 - Optional Local AI Advisor Evaluation

Status: not_started.

Outcome: evaluate whether a local-only advisor can summarize assumptions and
risks without changing source-of-truth calculations.

Exit gate: advisor is optional, offline, reproducible, and never required for
verification.

## I5 - Incubation Demonstrator

Status: not_started.

Outcome: assemble the kernel, scheduler, and telemetry into an offline demo that
shows the concept without deployment, mining, payments, or live services.

Exit gate: demo evidence shows deterministic local operation and clear
non-operational labeling.

## 1.0 Decision Gate

Status: not_started.

Outcome: decide whether to continue, archive, or re-scope the lab.

Required before 1.0:

- Clean license provenance.
- Privacy history review.
- Reviewed model assumptions and fixtures.
- Active maintenance owner.
- Security review of any retained or recovered legacy code.
- Decision on whether any operational pilot is appropriate.
