# Harness Evaluation Cycle 3 Friction Register

Status: completed for product-head evaluation; final-head artifacts remain
ignored.

This register records observed friction during Cycle 3. It distinguishes harness
defects from documentation gaps, application friction, environment constraints,
and manual workflow cost.

| ID | Area | Severity | Observation | Evidence | Disposition |
| --- | --- | --- | --- | --- | --- |
| C3-FR-001 | Environment | low | The sandbox denied a root-level temporary directory, so external installed-harness and artifact roots use the process temporary directory while staying outside both repositories. | Phase 2 installed-harness setup | accepted_constraint |
| C3-FR-002 | Harness bundle validation | high | A review bundle copy with a required supplement entry omitted still validated because the validator has no task-aware required supplement ID set. | `reports/review-bundle-negative-report.json`; `negative-bundle-tests/missing-required-supplement-entry.v1.json` | open |
| C3-FR-003 | Harness path hygiene | medium | Green evidence used logical paths and relocated successfully, but a red-phase child-process stderr artifact persisted raw machine-local path text. | `reports/path-hygiene-relocation-report.json`; `red-phase/red-phase-verify.stderr.txt` | open |
| C3-FR-004 | Harness provenance | medium | Harness-generated evidence records tool name and version but not the frozen harness git SHA, so install provenance must be supplied by surrounding evaluation records. | initial reviewer output; `green-product-head/evidence-manifest.v1.json` | open |
| C3-FR-005 | Evidence assembly | medium | The initial packet-only reviewer saw a stale path-hygiene supplement reference because the product-head bundle was created before the path-hygiene correction. The bundle was regenerated and revalidated, but the correction was manual. | initial reviewer output; regenerated `review/product-head-review-bundle.v1.json` | corrected_with_manual_step |
| C3-FR-006 | Boundary proof | low | Source and validator scans support no-network claims, but no OS-level syscall isolation was performed. | initial reviewer output; product-head review packet limitations | accepted_limitation |
