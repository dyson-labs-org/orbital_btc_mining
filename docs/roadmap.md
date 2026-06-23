# Roadmap

Orbital Compute Lab advances through incubation gates. Passing one gate does not
imply operational readiness.

## I0 - Audit/Re-charter

Status: in_progress for this milestone.

Outcome: preserve the legacy baseline, document risks, define the product
charter, add safety boundaries, establish harness verification, and keep legacy
runtime commands `not_run`.

Exit gate: local charter validator and harness checks pass.

## I1 - Deterministic Simulation Kernel

Outcome: introduce a minimal offline simulation kernel with deterministic input
fixtures, expected outputs, and uncertainty notes.

Exit gate: repeatable tests verify kernel behavior without external calls.

## I2 - Workload/Scheduler

Outcome: model workload windows, power limits, thermal limits, and scheduling
decisions without provider integrations.

Exit gate: scheduler fixtures cover nominal, constrained, and infeasible cases.

## I3 - Explainability/Telemetry

Outcome: produce explainable traces for assumptions, intermediate values,
warnings, and confidence limits.

Exit gate: every user-visible result can be traced to fixture inputs and model
steps.

## I4 - Optional Local AI Advisor Evaluation

Outcome: evaluate whether a local-only advisor can summarize assumptions and
risks without changing source-of-truth calculations.

Exit gate: advisor is optional, offline, reproducible, and never required for
verification.

## I5 - Incubation Demonstrator

Outcome: assemble the kernel, scheduler, and telemetry into an offline demo that
shows the concept without deployment, mining, payments, or live services.

Exit gate: demo evidence shows deterministic local operation and clear
non-operational labeling.

## 1.0 Decision Gate

Outcome: decide whether to continue, archive, or re-scope the lab.

Required before 1.0:

- Clean license provenance.
- Privacy history review.
- Reviewed model assumptions and fixtures.
- Active maintenance owner.
- Security review of any retained legacy code.
- Decision on whether any operational pilot is appropriate.
