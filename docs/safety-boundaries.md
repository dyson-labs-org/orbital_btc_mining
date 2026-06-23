# Safety Boundaries

## Operating Mode

Orbital Compute Lab operates in incubation mode. Verification must be local,
deterministic, and offline. The repository may contain legacy files that mention
deployment, email, Google Sheets, web servers, or Bitcoin economics, but those
paths are not authorized execution surfaces for I0.

## Allowed In I0

- Read-only static audit of repository files and Git history.
- Documentation updates that re-charter the repository.
- Harness metadata under `.agent-harness/`.
- Built-in Node.js validation and test scripts.
- `.\eng.ps1 bootstrap`.
- `.\eng.ps1 verify`.
- `git diff --check`.

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

## Data And Credential Boundary

- Do not commit secrets, tokens, local absolute paths, or live service
  credentials.
- Keep `.env`, `client.json`, and `analysis/client.json` ignored.
- Treat historical `user_reports/*.pdf` filenames as personal-data provenance
  evidence. The files are not present in the current tree, but their historical
  presence remains a privacy review item.

## External Service Boundary

The current tree references Google Sheets, Gmail-style email delivery, Render,
GitHub URLs, AWS Ground Station names in static data, and a local Flask URL.
These references are legacy inventory only. Harness verification must not call
those services.
