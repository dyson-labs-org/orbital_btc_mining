# Safety Boundaries

## Operating Mode

Orbital Compute Lab operates in incubation mode. Verification must be local,
deterministic, and offline. Legacy implementation source has been removed from
active main and preserved on `legacy/pre-orbital-compute-lab` for read-only
inspection.

## Allowed In I0

- Read-only static audit of repository files and Git history.
- Documentation updates that re-charter the repository.
- Harness metadata under `.agent-harness/`.
- Built-in Node.js validation and test scripts.
- `.\eng.ps1 bootstrap`.
- `.\eng.ps1 verify`.
- `git diff --check`.
- `node src/cli.mjs status`.
- `node src/cli.mjs status --json`.

## Not Authorized In I0

- `pip install -r requirements.txt`.
- `python app.py`.
- `gunicorn app:app`.
- Render build or start commands.
- Flask server execution.
- Google OAuth, Google Sheets, or email scripts.
- `analysis/lastrow.py` or `analysis/goog.py`.
- `autocommit.py` or `codex_merge.py`.
- `pnpm`, `npm install`, `npx`, package-manager builds, package-manager tests,
  or package-manager lint commands.
- Portal health checks, invoice creation, integration tests, smoke tests,
  dispatch commands, executor commands, or live service probes.
- Simulation kernel, scheduler, Bitcoin workload, AI workload, wallet, trading,
  hosted AI, hardware control, telemetry, or mission-authority implementation.

## Data And Credential Boundary

- Do not commit secrets, tokens, local absolute paths, or live service
  credentials.
- Keep `.env`, `client.json`, and `analysis/client.json` ignored.
- Treat historical `user_reports/*.pdf` filenames as personal-data provenance
  evidence. The files are not present in the current tree, but their historical
  presence remains a privacy review item.

## External Service Boundary

Historical audit documents reference Google Sheets, Gmail-style email delivery,
Render, GitHub URLs, AWS-named static data, and a local Flask URL. These are
legacy inventory only. Active source and harness verification must not call
those services.
