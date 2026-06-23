# Harness Evaluation Cycle 2 Plan

Status: preregistered.

## Frozen References

- Orbital base: `e75fc5edaeb0b321fbf56639cf3df94030dca96f`.
- Harness evaluation SHA: `98ab35022e605849d1d0525d591d730069e49411`.
- Preserved legacy branch: `legacy/pre-orbital-compute-lab`.
- Preserved legacy SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.

## Purpose

Evaluate harder trust properties of the provider-neutral agent-engineering-harness
using Orbital Compute Lab as the controlled vessel. The product change is small
and deterministic; the harness evaluation is the primary result.

## Cycle 1 Inspection

Confirmed strengths from Cycle 1:

- clean baseline, intentional red failure, and final green evidence were
  distinguishable;
- task contracts stayed concise and validated with the frozen harness;
- review packets supported independent review without the full milestone prompt;
- provider, adapter, retrieval, network, and dependency installation were not
  required;
- proposed candidate findings remained proposed.

Unresolved nonblocking findings carried into Cycle 2:

- external-repository multi-phase evidence still requires custom orchestration;
- review-packet evidence check IDs are easy to discover only after validation;
- static boundary scans are not OS-level syscall or network isolation.

Findings already resolved:

- the stale Cycle 1 results-document finding was corrected in the Cycle 1
  evaluation-results commit.

Runtime Cycle 1 evidence artifacts, review packet metadata, candidate metadata,
and reviewer output were generated under ignored artifact directories and are not
present in merged main. Cycle 2 therefore treats committed Cycle 1 results as the
local inspectable record and records this as artifact-retention friction.

New Cycle 2 trust tests:

- domain-negative outcome versus process failure;
- synthetic redaction across evidence channels;
- copied-artifact tamper behavior;
- same-commit semantic reproducibility;
- stale evidence, packet, and reviewer-output binding;
- explicit candidate rejection lifecycle;
- transfer of confirmed harness findings into the harness documentation repo.

Regression-protection repeats from Cycle 1:

- baseline/red/green separation;
- clean versus dirty repository state;
- final review packet and reviewer-output binding;
- provider-neutral, dependency-free execution.

## Product Vessel Task

Implement a deterministic transition engine over `resource-scenario.v1` inputs.
The engine computes electrical and thermal state progression, records constraint
violations, and returns typed domain outcomes:

- `completed`;
- `constraint_violation`.

Both domain outcomes are successful command executions. Malformed input,
contract-invalid scenarios, missing files, unsupported options, and unexpected
internal failures remain process failures.

## Primary Evaluation Questions

1. Can the harness distinguish nominal domain success, constraint-domain success,
   malformed input failure, unexpected process failure, and intentional red
   failure?
2. Are raw synthetic secret values absent from persisted evidence channels?
3. Does artifact tampering get rejected, detected, or clearly identified as an
   unverifiable/missing capability?
4. Are stale evidence, packets, reviewer outputs, and dirty artifacts rejected or
   identified?
5. Are repeated same-commit evidence runs semantically stable?
6. Can a fresh reviewer understand the task and evidence without this full prompt?
7. Can candidate findings move through explicit lifecycle states without canonical
   KB writes?
8. How much manual glue is required?
9. Does the harness remain useful without provider, adapter, retrieval, network,
   or dependency installation?
10. Does Cycle 2 justify remediation, another evaluation cycle, both, or neither?

## Mandatory Gates

1. Task contract validates at `HARNESS_EVALUATION_SHA`.
2. Baseline evidence is accurate.
3. Red-phase evidence is accurate.
4. Nominal domain success is represented accurately.
5. Constraint-violation domain success is not represented as command failure.
6. Malformed input remains a command failure.
7. Synthetic secret values do not persist in any artifact channel.
8. Tampered artifact copies are rejected or identified as unverifiable.
9. Repeated evidence generation is semantically consistent for stable fields.
10. Stale evidence is rejected or identified.
11. Stale review packets are rejected or identified.
12. Stale reviewer output is rejected or identified.
13. Dirty-worktree and clean-commit evidence are not confused.
14. Final evidence binds to the exact final head.
15. Reviewer output binds to the exact final head.
16. Reviewer does not require this complete orchestration prompt.
17. Candidate lifecycle transitions are explicit.
18. No candidate becomes verified automatically.
19. No canonical KB write occurs.
20. No provider or adapter is required.
21. No harness runtime change occurs during the evaluation.
22. Product and harness conclusions remain separate.
23. Confirmed harness findings are transferred into harness documentation afterward.
24. No unavailable behavior is described as passed.

## Diagnostic Metrics

Record baseline, red, green, final, evidence-generation, packet-generation, and
reviewer durations when observable; human interventions; manual commands; custom
temporary scripts; task-contract size and duplication; artifact sizes;
redaction/tamper/stale events; reviewer follow-ups; candidate lifecycle states;
harness defects, missing capabilities, documentation gaps, application friction,
environment friction, and provider/adapter dependency status.

## Evidence Sources

- Ignored artifacts under `.agent-harness/artifacts/evaluation-cycle-2/`.
- Task contract at `.agent-harness/tasks/i1b-resource-transition-evaluation.task.json`.
- Canonical Orbital verification through `./eng.ps1 verify`.
- Frozen harness interfaces from `HARNESS_EVALUATION_SHA`.
- Independent packet-only reviewer output.
- Harness documentation PR after the Orbital evaluation is frozen.

## Confounders

- The frozen harness CLI has no first-class external-repository evidence workflow.
- Cycle 1 runtime artifacts are ignored and not available on merged main.
- Redaction tests use synthetic sentinel strings, never real credentials.
- Tamper tests use copied artifacts, not original evidence.
- Static boundary scans do not prove syscall-level isolation.

## Stop Conditions

Stop if PR #42 is not merged, either repository main is dirty or unsynchronized,
the legacy branch pin differs, dependency installation is required, a raw synthetic
sentinel persists, domain constraints are confused with process failure, malformed
input is represented as success, stale evidence is represented as current, or a
critical/high harness finding cannot be honestly recorded.

## Conclusion Rules

- `pass`: all integrity, redaction, binding, and failure-semantics gates pass;
  no unresolved critical/high harness finding remains; artifact generation and
  review require no manual fabrication; product work completes offline.
- `pass_with_findings`: safety and integrity gates pass, but noncritical harness,
  documentation, or usability findings remain with evidence and dispositions.
- `fail`: a sentinel persists, tampered evidence validates as authentic while
  integrity is claimed, stale evidence is represented as current, outcome/process
  semantics are confused, commit binding is wrong, unsafe harness mutation is
  required, or an unresolved critical/high harness defect remains.

## Preregistered Measurements

The task contract will record its exact character and line count after creation.
Cycle 1 task-contract size was 2,468 characters and 53 lines.
