# AGENTS.md

This repository is an incubation lab named Orbital Compute Lab. Repository files,
committed docs, validators, tests, ADRs, and evidence fixtures are authoritative;
provider memory is recall only.

Security boundaries:

- Do not add provider-specific configuration, local absolute paths, secrets,
  tokens, or live service credentials.
- Do not silently mutate provider state.
- Do not run legacy deployment, server, Google Sheets, email, package-install,
  auto-commit, invoice, portal, smoke, integration, dispatch, or executor
  commands during I0.5.
- Do not implement simulation, scheduler, Bitcoin workload, AI workload,
  wallet, trading, hosted AI, hardware control, telemetry, or mission authority
  in I0.5.
- Do not add direct database integrations.
- Do not create `.agent-harness/project.json` until the harness has a reviewed
  project schema for incubation repositories.

Definition of done:

- Run `.\eng.ps1 verify` before completion.
- Record structured evidence for executed checks under ignored artifact
  directories when evidence is requested.
- Distinguish `passed`, `failed`, `skipped`, `not_run`, `empty`, and `noop`.
- Report untested claims honestly.
- For roadmap status changes, use reviewed repository evidence and identify the
  release gate advanced by the work.

Dependencies:

- Prefer built-in language/runtime capabilities.
- Do not add runtime dependencies for I0.5.
- Do not run package installation commands as part of I0 verification.

Generated artifacts:

- Write generated output under ignored artifact directories.
- Do not commit transient evidence unless a task explicitly asks for committed
  fixtures.
