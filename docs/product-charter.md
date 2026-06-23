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
- Define a roadmap from audit-only incubation to an optional demonstrator.

## Non-Goals

- No active Bitcoin mining.
- No wallet, payment, invoice, or treasury integration.
- No external service calls during verification.
- No Render, Flask, Google Sheets, email, or provider deployment work.
- No package installation or dependency update in I0.
- No deletion of legacy source as part of this re-charter.

## Product Principles

- Offline first: all verification must run without network access.
- Deterministic first: repeated runs should produce the same results.
- Explainable first: assumptions, formulas, and confidence limits must be
  inspectable.
- Provider-neutral: do not add provider-specific configuration or credentials.
- Audit-preserving: legacy material stays visible until a later reviewed
  cleanup milestone explicitly retires it.

## I0 Exit Criteria

I0 is complete only when the charter, safety boundary, audit report, roadmap,
task contract, validator, and local harness checks pass. I0 does not prove that
the legacy simulation is correct, safe to deploy, or ready for users.
