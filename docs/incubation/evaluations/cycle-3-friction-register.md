# Harness Evaluation Cycle 3 Friction Register

Status: open.

This register records observed friction during Cycle 3. It distinguishes harness
defects from documentation gaps, application friction, environment constraints,
and manual workflow cost.

| ID | Area | Severity | Observation | Evidence | Disposition |
| --- | --- | --- | --- | --- | --- |
| C3-FR-001 | Environment | low | The sandbox denied a root-level temporary directory, so external installed-harness and artifact roots use the process temporary directory while staying outside both repositories. | Phase 2 installed-harness setup | accepted_constraint |

Additional findings will be added only when supported by Cycle 3 evidence.
