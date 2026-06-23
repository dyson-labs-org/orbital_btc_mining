# Harness Evaluation Cycle 3 Results

Status: completed for the product-head evaluation; final-head binding evidence is
generated after this results commit by design.

Conclusion: `fail`.

The product vessel implementation passed its local verification, but the harness
remediation validation failed. Two fail-closed conditions were observed in
ordinary external-repository use:

- persisted red-phase evidence contained raw machine-local path text in a child
  process diagnostic;
- a bundle copy with one required supplement entry omitted still validated.

Orbital I1C remains `in_progress_pending_merge`. This incubation evidence is not
operational adoption, does not complete full I1, and does not complete harness
v0.2.

## Fixed References

- Orbital evaluation base: `7d5b61fe91594781bc923f6d8bca6b41a800a945`.
- Product-head implementation commit: `5bcdc0b188bc4c847403fbe1ffe1cd3601e88610`.
- Frozen harness evaluation SHA: `a424fc7273ab01f73a6d2f124b9fbced50882a1f`.
- Preserved legacy branch SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.

## Product Result

Product vessel result: passed.

I1C adds `scenario-suite.v1`, fixtures, a deterministic suite runner, CLI
coverage, status metadata, canonical verification checks, and documentation. The
runner executes existing `resource-scenario.v1` transition fixtures in declared
case order and compares actual outcomes with explicit expected outcomes and
optional ordered constraint-code expectations.

Implemented behavior:

- repository-relative suite scenario paths under `fixtures/runs/`;
- rejection of absolute paths, traversal, fixture-root escapes, unknown fields,
  duplicate case IDs, duplicate expected constraint codes, unknown outcomes,
  missing scenarios, and invalid scenarios;
- valid completed suites and expected `constraint_violation` suites exit `0`;
- expectation mismatches and malformed input exit nonzero;
- JSON output is deterministic and does not include wall-clock fields;
- status metadata reports only the resource-scenario, resource-transition, and
  scenario-suite capabilities now implemented.

Verification at product-head:

- `.\eng.ps1 verify`: passed with 86 Node tests.
- `node --test`: passed with 86 tests.
- `node scripts/validate-scenario-suites.mjs`: passed.
- `node src/cli.mjs run-suite ... --json`: deterministic across three runs.
- Deterministic suite JSON SHA-256:
  `b0fd3cfd0e5b8af4b451b31478d1bbb7958e7093e42f04da3e4a0d97d669198d`.
- Suite validator SHA-256:
  `03ef1d0f6f779fa8cdec539568edec7ce29ea84a73da1c51eb7f7781f4a4d158`.

Unimplemented product capabilities remain false and out of scope: full
simulation kernel, scheduler, Bitcoin workload, AI workload, profitability,
optimization, wallet behavior, Bitcoin node or pool behavior, transaction
construction or broadcast, hosted model/provider behavior, autonomous decisions,
hardware control, orbital propagation, operational mission planning, live
telemetry, and network behavior.

## Harness Remediation Validation

| Cycle 2 finding | Cycle 3 test | Result | Disposition |
| --- | --- | --- | --- |
| No first-class artifact-hash integrity validation. | Installed harness integrity rehashed product evidence, then copies with a one-byte tamper and a missing referenced stdout artifact were validated. | Valid evidence was `valid`; tampered and missing copies were `invalid`; authenticity remained `not_claimed`. | closed for referenced-byte integrity; harness-install provenance remains a new limitation. |
| External-repository evidence required bespoke glue. | Installed harness `external-evidence` ran Orbital `verify` from outside both source checkouts, without `PYTHONPATH`, editable install, or custom evidence-generation script. | Evidence generation passed and reported `target_mutation_detected: false`. | closed. |
| Review packets lacked structured supplemental evidence. | Six structured supplements and a review bundle were generated; negative tests removed one entry, changed a source commit, duplicated an ID, and removed a referenced supplement artifact. | Commit mismatch, duplicate ID, and missing referenced artifact failed; omitted supplement entry passed because the bundle has no expected required-ID set. | partially_closed; required supplement completeness remains open. |
| Ignored evidence persisted raw machine-local absolute paths. | Green evidence, relocated green evidence, and full artifact-root path scans were performed. | Green evidence and relocation passed, but full artifact scan found two raw path matches in red-phase stderr diagnostics. | open. |

## Integrity And Portability

| Gate | Evidence | Status |
| --- | --- | --- |
| Installed harness outside both checkouts | installed-style environment using the frozen harness SHA and no `PYTHONPATH` | passed |
| External evidence without bespoke glue | `green-product-head/evidence-manifest.v1.json` | passed |
| Orbital unmodified by evidence generation | manifest `target_mutation_detected: false` and clean worktree | passed |
| Logical artifact references | evidence and supplement references use `artifacts` logical root | passed |
| Forbidden path scan | `reports/path-hygiene-relocation-report.json` | failed |
| Relocated artifact root | `relocated-green-product-head/relocated-integrity-report.v1.json` | passed |
| Referenced bytes rehashed | `green-product-head/integrity-report.v1.json` | passed |
| One-byte tamper detection | `tamper-green-product-head/tamper-integrity-report.v1.json` | passed |
| Missing artifact detection | `missing-green-product-head/missing-integrity-report.v1.json` | passed |
| Dirty binding | red-phase integrity reported dirty binding rather than byte mismatch | passed |
| Target-repository mutation | `target-mutation/evidence-manifest.v1.json` and report | passed |
| Structured supplements | six generated `review-supplement.v1` files | passed |
| Required supplement omission | `negative-bundle-tests/missing-required-supplement-entry.v1.json` | failed |
| Supplement source-commit mismatch | negative bundle test | passed |
| Duplicate supplement ID | negative bundle test | passed |
| Candidate lifecycle | two synthetic candidates moved only from proposed to rejected | passed |
| Canonical KB write | candidate report records no canonical KB write | passed |
| Provider and adapter behavior | source scans and task contract record not required | passed |
| Reviewer independence | fresh reviewer did not receive or request the full milestone prompt | passed |

The artifact set contains 40 files totaling 198,197 bytes at product-head. The
main generated review bundle validates structurally with status `failed` because
the path-hygiene and required-supplement gates failed.

## Reviewer Result

Initial packet-only reviewer verdict: `fail`.

The reviewer did not request the full milestone prompt, manual path explanations,
additional context, or follow-up questions. They reported missing supplements for
later stale-binding and final-head phases, plus these findings:

- high: omitted required supplement entries are not detected;
- high: the then-current bundle referenced an older path-hygiene supplement;
- medium: raw local path text persisted in red-phase diagnostics;
- medium: harness-generated manifests record harness version but not the frozen
  harness git SHA;
- low: no OS-level network isolation proof was provided.

After the initial review, the product-head bundle was regenerated from the
corrected path-hygiene supplement and revalidated successfully. The reviewer
verdict is preserved as returned; it is not rewritten.

## Ceremony Comparison

Cycle 3 reduced some custom ceremony compared with Cycle 2:

- ordinary external evidence was generated by the installed harness rather than
  by a temporary custom evidence script;
- integrity, relocation, tamper, missing-artifact, mutation, supplement, bundle,
  and candidate-lifecycle evidence were represented as structured artifacts;
- tamper and missing-artifact checks used copied artifact sets rather than
  modifying original evidence;
- candidate hypotheses were explicitly rejected rather than auto-verified.

Manual ceremony and remaining friction:

- a full artifact-root path scan was still manual;
- a path-hygiene supplement had to be corrected after a red-phase diagnostic
  surfaced raw path text;
- the bundle negative test required manually constructed copies;
- the bundle validator has no task-aware required-supplement set, so omission
  detection still required external interpretation;
- stale-binding and final-head checks occur after this results commit and are
  recorded in ignored artifacts and the pull request body.

Unavailable or not comparable:

- Cycle 2 exact artifact-generation duration, bundle-generation duration, total
  artifact size, and reviewer follow-up counts were not available in a directly
  comparable form.
- Cycle 3 did not perform OS-level syscall isolation for network behavior.

## Preregistered Measurements

- Cycle 1 task contract: 2,521 characters, 53 lines.
- Cycle 2 task contract: 3,024 characters, 57 lines.
- Cycle 3 task contract: 3,984 characters, 76 lines.
- Duplicated rule count: zero copied milestone sections; repeated safety
  boundaries are summarized and linked.
- Product-head external evidence command duration: 16.520615 seconds.
- Product-head artifact count and size: 40 files, 198,197 bytes.
- Review bundle supplement count: 6.
- Reviewer full-prompt requests: 0.
- Reviewer follow-up questions: 0.

## Conclusion

Final conclusion for the harness remediation validation: `fail`.

Product I1C should proceed only as an incubation product change with a draft PR
and review. The harness next step should be remediation plus another cycle, not
selection of another Orbital feature and not operational adoption.
