# Safety Boundaries

Orbital Compute Lab is local, deterministic, and non-production unless a later reviewed gate explicitly changes that boundary.

## Authorized Local Surfaces

- Repository-local source, fixtures, tests, and documentation.
- `.\eng.ps1 bootstrap` and `.\eng.ps1 verify`.
- Node.js validators and deterministic CLI commands documented in `README.md`.
- Ignored artifacts under `.agent-harness/artifacts/` and `.agent-harness/tmp/`.
- Read-only inspection of `legacy/pre-orbital-compute-lab`.

## Prohibited External Side Effects

- Secrets, tokens, live credentials, wallet material, payment credentials, or live service credentials.
- Real payments, real mining, transaction broadcast, wallet operations, exchange trading, or billed service use.
- Production deployment, hosted model calls, provider or adapter activation, external service mutation, direct database integration, hardware control, or mission-authority behavior.
- Repository or organization administration, protected/default branch force-push, repository deletion, or mutation of `legacy/pre-orbital-compute-lab`.
- Canonical KB writes before a reviewed gate.

## Credential And Data Boundary

Do not commit local absolute paths, secrets, tokens, `.env` values, client files, or credentials. Treat historical user-report filenames in legacy records as privacy-review provenance only; the files are not present in the active tree.

## Stop Rule

If a task needs a prohibited external side effect, stop before running it and require explicit reviewed authorization plus new evidence requirements.