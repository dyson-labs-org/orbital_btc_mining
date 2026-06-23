# Harness Evaluation Cycle 1 Plan

Status: preregistered.

## Frozen References

- Orbital base: `1c86ef82e4a30e0e9404c7fed931cc3345e2a1c1`.
- Harness evaluation SHA: `98ab35022e605849d1d0525d591d730069e49411`.
- Preserved legacy branch: `legacy/pre-orbital-compute-lab`.
- Preserved legacy SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.

## Purpose

Evaluate whether the provider-neutral agent-engineering-harness can support a
small, realistic external-repository engineering task without requiring a
provider, adapter, retrieval system, dependency installation, or network access
for local verification.

The Orbital Compute Lab change is the vessel. The harness is the subject under
evaluation.

## Product Task

Define a versioned deterministic resource-scenario contract and validator for
future simulation inputs. This cycle must not implement a simulation kernel,
scheduler, Bitcoin workload, AI workload, telemetry, optimization, wallet,
network, hardware-control, or mission-authority behavior.

## Primary Questions

1. Can a concise repository-local task contract express the work by referencing
   `AGENTS.md`, safety boundaries, verification docs, and this plan?
2. Can the canonical verification path distinguish baseline success, an
   intentional red failure, final success, dirty worktree evidence, and clean
   commit-bound evidence?
3. Are evidence manifests schema-valid, accurate, redacted, commit-bound, and
   useful without manual rewriting?
4. Does the review packet give a fresh reviewer enough local context to
   challenge the change?
5. Can proposed candidate findings remain proposed and outside any canonical
   knowledge store?
6. How much manual ceremony and bespoke scripting does the harness require?
7. Does the harness remain useful with no provider, adapter, retrieval system,
   network, or dependency installation?
8. Which friction belongs to the application, harness, documentation, operating
   environment, or human workflow?
9. Is another evaluation cycle justified, or should harness remediation happen
   first?

## Mandatory Harness Gates

1. Task contract validates against the frozen harness revision.
2. Baseline success is recorded accurately.
3. Intentional red-phase failure is recorded as failed.
4. Final success is recorded as passed.
5. Dirty and clean repository states are not confused.
6. Evidence binds to the intended commit or worktree state.
7. Required child failures propagate nonzero.
8. Final evidence contains no raw secret.
9. Review output is bound to the final source commit.
10. Stale evidence is rejected or identified.
11. Proposed candidate findings remain proposed.
12. No canonical KB write occurs.
13. No provider is required.
14. The full task is reproducible offline.
15. The final reviewer can evaluate without the full milestone prompt.
16. Product results and harness results are reported separately.

## Diagnostic Metrics

Record durations for baseline, red, and final verification; implementation;
evidence generation; review-packet generation; and reviewer effort when
observable. Record human interventions, manual coordination commands, harness
commands used, temporary scripts required, task-contract size, evidence size,
review-packet size, reviewer follow-up questions, findings by severity, stale
evidence events, harness defects, documentation gaps, application defects,
environment limits, provider or adapter dependencies, and generated-artifact
management friction.

These metrics are diagnostic only. No retrospective pass threshold is set here.

## Evidence Sources

- Ignored artifacts under `.agent-harness/artifacts/evaluation-cycle-1/`.
- The task contract at `.agent-harness/tasks/i1a-resource-scenario-contract.task.json`.
- Canonical Orbital verification through `.\eng.ps1 verify`.
- Frozen harness interfaces from `HARNESS_EVALUATION_SHA`.
- Independent reviewer output bound to the final head commit.

## Preregistered Measurements

- Task-contract size: 2,468 characters, 53 lines.

## Confounders

- The frozen harness task schema validates only a small required field set and
  allows task-specific metadata.
- Merged main still contains pre-merge I0.5 wording in roadmap and charter
  documents; this is application documentation friction observed before product
  implementation.
- GitHub Actions may require repository history to verify preserved branch refs.

## Stop Conditions

Stop if the legacy branch SHA differs, if either repository main is dirty or
unsynchronized before the frozen SHAs are recorded, if dependency installation is
required, if product verification requires a provider or adapter, if the red
phase cannot be represented honestly, or if a critical/high harness-integrity
finding cannot be resolved inside the Orbital repository.

## Classification Method

- `pass`: all mandatory gates pass, no unresolved critical/high harness finding
  remains, evidence and review packets are usable, the task completes offline,
  and friction is understood and bounded.
- `pass_with_findings`: safety and evidence gates pass and the task completes,
  but noncritical harness or documentation gaps remain.
- `fail`: evidence cannot be trusted, required failures are hidden, commit
  binding is wrong, the reviewer cannot verify from supplied artifacts, the task
  contract misrepresents the work, unsafe/undocumented mutation is required, or
  provider-neutral execution is impossible.
