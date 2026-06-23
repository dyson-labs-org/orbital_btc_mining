# Harness Evaluation Cycle 1 Friction Register

Status: completed_pending_merge.

| ID | Severity | Owner category | Affected phase | Evidence | Workaround | Proposed disposition | Blocks next cycle | Candidate finding |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1-FR-001 | low | application configuration | Phase 0 | `docs/roadmap.md` and `docs/product-charter.md` still described I0.5 as pending after PR #41 was merged. | Record as pre-existing friction and correct on the I1A branch. | Corrected in the evaluation-results commit. | no | none |
| C1-FR-002 | medium | harness missing capability | Phases 1, 5, 8, 10 | Baseline, red, green, boundary, supplement, and metrics artifacts required custom scripts around harness primitives. | Use documented harness primitives plus explicit local orchestration scripts, and record the scripts as ceremony. | Consider a harness workflow command for external-repository multi-phase evidence. | no | `cycle1-harness-external-evidence-custom-script` |
| C1-FR-003 | low | harness documentation gap | Phase 10 | First review-packet validation failed because evidence used `charter` rather than required check ID `contracts`. | Regenerate evidence with `contracts`, `unit-tests`, and `diff-check`. | Document required review packet evidence IDs or expose a clearer validation error path. | no | `cycle1-harness-task-schema-minimal` |
| C1-FR-004 | low | environment limitation | Phases 8 and 9 | Windows Git emitted LF-to-CRLF warnings on edited files while `git diff --check` still passed. | Treat warnings as environment noise unless diff validation fails. | Keep line-ending behavior visible in evidence. | no | none |
| C1-FR-005 | low | evaluation-design limitation | Phases 8, 10, and 14 | Boundary confidence used source scans and local tests rather than OS-level syscall or network isolation. | Record residual risk and avoid claiming stronger isolation. | Decide whether future cycles need syscall/network instrumentation. | no | none |

