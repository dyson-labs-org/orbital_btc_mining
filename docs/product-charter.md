# Product Charter

## Name

Orbital Compute Lab.

## Classification

Incubation repository. This is not an operational pilot, not a deployed service,
and not a provider integration.

## Purpose

Build a deterministic offline research environment for evaluating orbital
compute tradeoffs before any production, deployment, mining, payment, or live
provider integration is considered.

## Near-Term Outcomes

- Preserve the legacy repository state for review.
- Document safety boundaries, provenance risks, command surfaces, and research
  assumptions.
- Establish a harness-compatible task contract and validator.
- Isolate legacy source from active main while preserving the protected branch.
- Establish a dependency-free product skeleton with an honest status CLI.
- Define a roadmap from audit-only incubation to an optional demonstrator.

## Non-Goals

- No active Bitcoin mining.
- No wallet, payment, invoice, or treasury integration.
- No external service calls during verification.
- No Render, Flask, Google Sheets, email, or provider deployment work.
- No package installation or dependency update in I0.
- No simulation kernel, scheduler, Bitcoin workload, AI workload, wallet,
  trading, hardware control, or mission-authority behavior in I0.5.

## Product Principles

- Offline first: all verification must run without network access.
- Deterministic first: repeated runs should produce the same results.
- Explainable first: assumptions, formulas, and confidence limits must be
  inspectable.
- Provider-neutral: do not add provider-specific configuration or credentials.
- Audit-preserving: legacy material stays visible until a later reviewed
  cleanup milestone explicitly retires it.
- Skeleton honesty: metadata and CLI output must report only implemented
  capabilities.

## I0 Exit Criteria

I0 is complete only when the charter, safety boundary, audit report, roadmap,
task contract, validator, and local harness checks pass. I0 does not prove that
the legacy simulation is correct, safe to deploy, or ready for users.

## I0.5 Exit Criteria

I0.5 is complete. It preserved the legacy branch, removed legacy implementation
from active main, added a dependency-free Node.js skeleton, verified offline on
Windows and Ubuntu, retained audit and licensing uncertainty, recorded harness
friction, and received human review.

## I1A Exit Criteria

I1A remains pending until merged. It may define only a deterministic
resource-scenario input contract, fixture validator, and CLI validation surface.
It must not implement the simulation kernel, scheduler, Bitcoin workload, AI
workload, telemetry, optimization, network behavior, provider behavior, wallet,
trading, hardware control, or mission authority.
