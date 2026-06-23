# Legacy Inventory

This inventory was produced from static inspection of the repository at baseline
SHA `c93c7366edcd86b83896c3c39b753805183c3126`.

## Repository Shape

Tracked file count: 32.

Primary legacy surfaces:

- `app.py`: Flask web app with `/`, `/orbit_visuals/<idx>`,
  `/api/estimate_cost`, `/api/simulate`, and `/health` routes.
- `main.py`: command-line style trade-study script with local absolute path
  references.
- `requirements.txt`: Python runtime/development dependencies.
- `render.yaml` and `Procfile`: Render/gunicorn deployment surfaces.
- `analysis/lastrow.py`: Google Sheets, OAuth, PDF output, and email workflow.
- `analysis/goog.py`: Google Sheets OAuth helper.
- `autocommit.py` and `codex_merge.py`: Git-mutating helper scripts.
- `readme.txt`: legacy user setup instructions.
- `LICENSE`: MIT text with unresolved merge conflict markers.

## Command Surface

| Command or surface | Status | Reason |
| --- | --- | --- |
| `pip install -r requirements.txt` | not_run | Network package installation is outside I0. |
| `python app.py` | not_run | Starts a Flask server and executes legacy app code. |
| `gunicorn app:app` | not_run | Deployment/server command. |
| Render `buildCommand` and `startCommand` | not_run | Deployment service path. |
| `analysis/lastrow.py` | not_run | Uses Google OAuth, Sheets, file output, and email. |
| `analysis/goog.py` | not_run | Uses Google OAuth and Sheets. |
| `autocommit.py` | not_run | Mutates Git state. |
| `codex_merge.py` | not_run | Writes files, commits with Git, and may run `python app.py`. |
| `package.json` scripts | empty | No `package.json` exists in the baseline tree. |
| `pnpm` workspace scripts | empty | No `pnpm-workspace.yaml` exists in the baseline tree. |
| `npx` commands | empty | No npx command surface was found. |
| Portal health, invoice, integration, smoke, dispatch, executor commands | empty | Not present in this repository baseline. |

## External References

- `render.yaml`: Render web service configuration.
- `analysis/lastrow.py`: Google Sheets URL and email sender flow.
- `analysis/goog.py`: Google Sheets OAuth scope and placeholder sheet URL.
- `readme.txt`: local Flask URL `http://127.0.0.1:5000`.
- `radiation/rf_model.py`: static AWS-named ground-station records.
- `analysis/lastrow.py`: legacy GitHub URL text.

## Local Absolute Paths

The current tree contains local Windows paths in:

- `main.py`
- `analysis/lastrow.py`

Those paths are provenance risks and must not be copied into future production
configuration.

## Legacy Source Status

I0.5 removes legacy implementation source from active main after reviewed
deletion planning. The source remains available on
`legacy/pre-orbital-compute-lab` at
`c93c7366edcd86b83896c3c39b753805183c3126`. See
[legacy-removal-manifest.md](legacy-removal-manifest.md) and
[legacy-source-access.md](legacy-source-access.md).
