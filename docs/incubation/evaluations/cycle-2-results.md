# Harness Evaluation Cycle 2 Results

Status: pass_with_findings.

Date recorded: 2026-06-23.

## Fixed References

- Orbital evaluation base: `e75fc5edaeb0b321fbf56639cf3df94030dca96f`.
- Product-head source commit: `c6048201a331c7ead70649deb8cbc4b10564edc4`.
- Frozen harness evaluation SHA: `98ab35022e605849d1d0525d591d730069e49411`.
- Preserved legacy branch SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.

## Product Result

I1B adds a deterministic resource-transition engine over validated
`resource-scenario.v1` inputs. Nominal runs produce a `completed` domain
outcome. Constraint runs produce a `constraint_violation` domain outcome while
remaining successful command executions. Malformed input and internal arithmetic
overflow remain process failures.

The product change stayed inside the I1B boundary. It does not implement the
full simulation kernel, scheduler, Bitcoin workloads, AI workloads,
profitability, telemetry, optimization, wallet behavior, network behavior,
provider behavior, hardware control, or mission authority.

## Harness Evaluation Result

The harness remained useful for offline product verification, red/green
separation, task-contract validation, review-packet generation, reviewer-output
binding, and candidate lifecycle recording. Cycle 2 also found nonblocking
harness and evidence-packaging gaps:

- external-repository multi-phase evidence still requires custom glue around the
  frozen harness primitives;
- copied-artifact tamper detection is not available as a documented harness
  integrity-validation operation;
- review packets do not directly include all redaction, tamper,
  reproducibility, stale-binding, and candidate-lifecycle artifacts;
- generated ignored evidence records local absolute artifact paths.

These findings do not block the I1B product branch because they were identified
honestly, not reported as passed harness capabilities.

## Evidence Phases

| Phase | Status | Source commit | Notes |
| --- | --- | --- | --- |
| Baseline | passed | `e75fc5edaeb0b321fbf56639cf3df94030dca96f` | 38 tests passed before I1B changes. |
| Red phase | expected failed | dirty preregistration state | `./eng.ps1 verify` failed after tests and CLI expectations were added before implementation. |
| Product head | passed | `c6048201a331c7ead70649deb8cbc4b10564edc4` | 61 tests passed; product-head evidence and review packet validated. |
| Redaction stress | passed | `c6048201a331c7ead70649deb8cbc4b10564edc4` | Synthetic sentinel had zero raw matches across tested channels. |
| Tamper stress | identified_missing_capability | `c6048201a331c7ead70649deb8cbc4b10564edc4` | Schema validation passed for a tampered copy; a custom hash comparison found one mismatch. |
| Reproducibility | passed | `c6048201a331c7ead70649deb8cbc4b10564edc4` | Stable fields matched across same-commit runs after excluding timestamps, durations, and artifact paths. |
| Candidate lifecycle | passed | `c6048201a331c7ead70649deb8cbc4b10564edc4` | Two harness findings remained proposed; one disproven redaction candidate was rejected. |

Generated evidence is ignored and stored under
`.agent-harness/artifacts/evaluation-cycle-2/`.

## Product-Head Evidence Values

- Status JSON SHA-256: `79f37452feb185b824faa134f579c2da8f4bd978216fa8d213cbc1bab9a9df08`.
- Nominal run JSON SHA-256: `da9328d1d0514da0475347bae7612e49f98e0fb12f309b1145e9f242cdfa64ac`.
- Constraint run JSON SHA-256: `f6fba555d89809f131e3fb9393344cf6c721924592fd848195caf3905c5a443c`.
- Product-head review packet: `.agent-harness/artifacts/evaluation-cycle-2/review-packet.product-head.v1.json`.
- Product-head reviewer output: `.agent-harness/artifacts/evaluation-cycle-2/reviewer-output.product-head.json`.

## Independent Review

A fresh packet-oriented reviewer returned `pass_with_findings`. A second
read-only reviewer notification agreed with the same conclusion. Reviewer-output
validation passed for both outputs at the product-head source commit.

Product-blocking findings: none.

Harness or evidence findings:

- medium: no documented frozen-harness operation recomputes referenced artifact
  hashes and rejects tampered copied evidence;
- low: the review packet requires a separately generated supplement for the full
  Cycle 2 integrity context;
- low: ignored generated evidence includes local absolute artifact paths;
- low: stale-binding checks are completed after this docs-only commit so the
  product-head packet and reviewer output can become stale by construction.

## Gate Summary

| Gate | Status | Evidence |
| --- | --- | --- |
| Task contract validates | passed | preregistered and product-head task validation artifacts |
| Baseline evidence accurate | passed | baseline summary and manifest |
| Intentional red failure separated from main | passed | red-phase summary |
| Nominal domain success represented accurately | passed | product-head evidence and transition tests |
| Constraint domain success distinct from process failure | passed | product-head evidence and transition tests |
| Malformed input remains process failure | passed | expected-invalid run checks |
| Raw synthetic secret absent from artifacts | passed | redaction result |
| Tamper behavior honestly classified | passed_with_findings | missing harness integrity operation recorded |
| Same-commit semantic reproducibility | passed | reproducibility comparison |
| Candidate lifecycle explicit | passed | candidate list |
| Canonical KB write avoided | passed | candidate list records `not_performed` |
| Provider and adapter avoided | passed | baseline, red, product-head summaries |
| Harness runtime unchanged during evaluation | passed | harness SHA frozen; no harness runtime edits made |
| Product and harness conclusions separated | passed | this document and friction register |

## Not Run And Out Of Scope

The following were intentionally `not_run`: dependency installation, package
manager commands, legacy source execution, provider calls, adapter calls,
network service calls, deployment, server startup, wallet behavior, Bitcoin node
or pool behavior, hosted AI calls, hardware control, and mission-authority
operations.

Cycle 2 does not claim scientific correctness, orbital feasibility,
profitability, production readiness, or operational pilot readiness.

## Disposition

I1B is suitable for a draft Orbital PR as a deterministic offline product
increment and as a harness evaluation vessel. Harness findings should be
transferred to the provider-neutral harness documentation after Orbital final
evidence is frozen. I1B remains `in_progress_pending_merge` until reviewed,
validated by CI, approved, and merged.
