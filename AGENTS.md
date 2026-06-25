# AGENTS.md

This repository is the Orbital Compute Lab operational pilot and controlled test range for the provider-neutral Agent Engineering Harness. Repository files, committed docs, validators, tests, ADRs, and evidence fixtures are authoritative; provider memory is recall only.

Test-range authority:

- Reviewed pilot branches may add or remove dependencies, rewrite product files, refactor local contracts and fixtures, add test doubles, inject failures, run destructive migrations against disposable repo-local state, exercise rollback and recovery, add or remove experimental capabilities, abandon a branch, or revert and replace prior pilot implementation.
- Keep deterministic product behavior honest. Do not claim simulation, scheduler, Bitcoin, AI, wallet, trading, hosted model, network, hardware-control, production, or mission-authority capability unless the capability is implemented, verified, and reviewed.
- Preserve `legacy/pre-orbital-compute-lab`; inspect it read-only when needed.

External-side-effect boundaries:

- Do not add provider-specific configuration, local absolute paths, secrets, tokens, wallet material, payment credentials, or live service credentials.
- Do not silently mutate provider state, external services, production deployments, billed resources, real payments, real mining, wallets, repository or organization administration, protected/default branches, or canonical KB state.
- Do not add direct database integrations.
- Do not create `.agent-harness/project.json` for OP-0; no consumed schema exists yet.

Definition of done:

- Run `.\eng.ps1 verify` before completion.
- Record structured evidence for executed checks under ignored artifact directories when evidence is requested.
- Distinguish `passed`, `failed`, `skipped`, `not_run`, `empty`, and `noop`.
- Report untested claims honestly.
- For roadmap status changes, use reviewed repository evidence and identify the release gate advanced by the work.

Dependencies:

- Prefer built-in language/runtime capabilities.
- Runtime dependencies are allowed only when a reviewed pilot task justifies them and verification remains reproducible.
- Package installation requires explicit task evidence; it is not part of OP-0 verification.

Generated artifacts:

- Write generated output under ignored artifact directories such as `.agent-harness/artifacts/` or `.agent-harness/tmp/`.
- Do not commit transient evidence unless a task explicitly asks for committed fixtures.