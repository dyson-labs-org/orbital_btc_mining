# Legacy Removal Manifest

Milestone: I0.5 - Legacy Isolation and Clean Product Skeleton

I0 main SHA: `3c2649e51a23aa408a4e7aee9192fd47e327bad6`

Protected legacy branch: `legacy/pre-orbital-compute-lab`

Protected legacy SHA: `c93c7366edcd86b83896c3c39b753805183c3126`

Review state: approved by deletion-plan reviewer.

## Purpose

This manifest classifies every path present in active main before I0.5 changes.
Deleting a file from active main does not delete Git history. Each planned
legacy removal is recoverable from `legacy/pre-orbital-compute-lab`.

## Active Path Classification

| Path | Classification | Disposition |
| --- | --- | --- |
| `.agent-harness/README.md` | retain and update | Keep harness guidance and add I0.5 task context. |
| `.agent-harness/tasks/i0-audit-recharter.task.json` | retain unchanged | I0 audit contract remains historical evidence. |
| `.gitignore` | retain and update | Keep ignored artifact roots. |
| `.python-version` | delete from active main | Legacy Python runtime marker. |
| `AGENTS.md` | retain and update | Active operating instructions. |
| `LICENSE` | delete from active main | Legacy conflicted license text; uncertainty remains documented. |
| `Procfile` | delete from active main | Legacy deployment command. |
| `README.md` | retain and update | Active repository README. |
| `analysis/goog.py` | delete from active main | Legacy Google Sheets OAuth helper. |
| `analysis/last_row.txt` | delete from active main | Legacy runtime state marker. |
| `analysis/lastrow.py` | delete from active main | Legacy Google Sheets, email, PDF workflow. |
| `analysis/one_pager.py` | delete from active main | Legacy report-generation source. |
| `analysis/orbit_plot.py` | delete from active main | Legacy plotting source. |
| `analysis/plot_radar.py` | delete from active main | Legacy plotting source. |
| `analysis/plot_summary_table.py` | delete from active main | Legacy plotting/report source. |
| `analysis/roi_plot.py` | delete from active main | Legacy Bitcoin economics plotting source. |
| `app.py` | delete from active main | Legacy Flask application. |
| `autocommit.py` | delete from active main | Legacy Git-mutating helper. |
| `code.txt` | delete from active main | Legacy helper input. |
| `codex_merge.py` | delete from active main | Legacy file/Git-mutating helper. |
| `config/orbits_to_test.json` | delete from active main | Legacy simulation fixture. |
| `costmodel/cost.py` | delete from active main | Legacy Bitcoin economics model. |
| `docs/architecture/ADR-0001-recharter-as-orbital-compute-lab.md` | retain unchanged | I0 architecture decision. |
| `docs/architecture/ADR-0002-deterministic-offline-first.md` | retain unchanged | I0 architecture decision. |
| `docs/audit-report.md` | retain and update | Audit record remains authoritative and gains I0.5 note. |
| `docs/legacy-inventory.md` | retain and update | Legacy inventory remains public evidence. |
| `docs/product-charter.md` | retain and update | Active charter. |
| `docs/research-assumptions.md` | retain unchanged | Active assumption record. |
| `docs/roadmap.md` | retain and update | Add I0.5 gate and keep I1 unstarted. |
| `docs/safety-boundaries.md` | retain and update | Active safety boundary. |
| `docs/verification-plan.md` | retain and update | Active verification plan. |
| `eng.ps1` | retain and update | Canonical verification wrapper. |
| `launch/launch_model.py` | delete from active main | Legacy launch model. |
| `launch/launcher_db.csv` | delete from active main | Legacy launch model data. |
| `main.py` | delete from active main | Legacy command-line trade-study script with local paths. |
| `orbits/eclipse.py` | delete from active main | Legacy orbit/eclipse model. |
| `power/power_model.py` | delete from active main | Legacy power model. |
| `power/solid_state_model.py` | delete from active main | Legacy solid-state mining model. |
| `radiation/Thermal.py` | delete from active main | Legacy thermal model. |
| `radiation/rf_model.py` | delete from active main | Legacy RF model with static provider-named data. |
| `radiation/tid_model.py` | delete from active main | Legacy radiation model. |
| `radiation/via_model.py` | delete from active main | Legacy via model. |
| `readme.txt` | delete from active main | Superseded legacy README. |
| `render.yaml` | delete from active main | Legacy Render deployment configuration. |
| `requirements.txt` | delete from active main | Legacy Python dependency list. |
| `scripts/validate-incubation-charter.mjs` | retain and update | Active validator. |
| `templates/index.html` | delete from active main | Legacy Flask template. |
| `tests/incubation-charter.test.mjs` | retain and update | Active tests. |

## Planned Deletions

All planned deletion paths were present in the legacy branch at
`c93c7366edcd86b83896c3c39b753805183c3126`. `Blob SHA` is the active-main blob
before deletion.

| Path | Blob SHA | Executable code | External-service risk | I0/I0.5 execution | Provenance status | Licensing status | Recovery |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.python-version` | `1d4830ee0217d9ab8af049485d9feae30c3b5582` | no | no | not_run | legacy runtime marker | legacy unresolved | `git show legacy/pre-orbital-compute-lab:.python-version` |
| `LICENSE` | `b41d29e35aaae3791079b7333c956ba5fde1ea68` | no | no | not_run | legacy conflicted license | unresolved conflict markers | `git show legacy/pre-orbital-compute-lab:LICENSE` |
| `Procfile` | `ca6e941cbc79a8519bfef7475ea15c12cb0b5550` | no | yes, deploy command | not_run | legacy deployment | legacy unresolved | `git show legacy/pre-orbital-compute-lab:Procfile` |
| `analysis/goog.py` | `7422fd5b0c74d29bdbaa2f909cf8960b40adfcb4` | yes | yes, Google Sheets OAuth | not_run | legacy external-service helper | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/goog.py` |
| `analysis/last_row.txt` | `3e932fe8f188bb6dbcb02afe1306fa6e0b90357b` | no | no | not_run | legacy runtime state | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/last_row.txt` |
| `analysis/lastrow.py` | `e891d2bead0309f6d339c702c973bf5ee64b10ff` | yes | yes, Google Sheets and email | not_run | legacy external-service helper with local paths | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/lastrow.py` |
| `analysis/one_pager.py` | `1ee95ae1ca28c092455442fb55af1059edd81d69` | yes | no known active call | not_run | legacy report source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/one_pager.py` |
| `analysis/orbit_plot.py` | `beb666735117c60fce560c38b2b6ecc334df51b7` | yes | no known active call | not_run | legacy plotting source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/orbit_plot.py` |
| `analysis/plot_radar.py` | `4df3ecd28c61f651cb9b935f1c10a77fb2d94732` | yes | no known active call | not_run | legacy plotting source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/plot_radar.py` |
| `analysis/plot_summary_table.py` | `e0f1d8b48e6c58c62fcc78961f0a265a11a8d2af` | yes | no known active call | not_run | legacy report source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/plot_summary_table.py` |
| `analysis/roi_plot.py` | `df5ebf2f806756f1d54f63a44472d919b71fc301` | yes | no known active call | not_run | legacy Bitcoin economics source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:analysis/roi_plot.py` |
| `app.py` | `eb80ea374099674062817bcff80761161f0ab6c4` | yes | yes, Flask server and env port | not_run | legacy application source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:app.py` |
| `autocommit.py` | `44a408d0a7bf4e76b90f1e49585d10425df7772b` | yes | no network, mutates Git | not_run | legacy Git-mutating helper | legacy unresolved | `git show legacy/pre-orbital-compute-lab:autocommit.py` |
| `code.txt` | `6daeaf68df8a0236f6a7d186e8df967b9d22d28a` | no | no | not_run | legacy helper input | legacy unresolved | `git show legacy/pre-orbital-compute-lab:code.txt` |
| `codex_merge.py` | `03e84895420da9e1f44fc0d73effcb987a1265ce` | yes | no network, mutates files and Git | not_run | legacy file/Git-mutating helper | legacy unresolved | `git show legacy/pre-orbital-compute-lab:codex_merge.py` |
| `config/orbits_to_test.json` | `1db7d3912b6b9822eb93c89c179f916726056dc6` | no | no | not_run | legacy model fixture | legacy unresolved | `git show legacy/pre-orbital-compute-lab:config/orbits_to_test.json` |
| `costmodel/cost.py` | `483c05661d5a69cc0e3f7243e4d0105d9be621f1` | yes | no known active call | not_run | legacy Bitcoin economics model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:costmodel/cost.py` |
| `launch/launch_model.py` | `651d9f06a8f093335a033ec6683f3f1413b3fce1` | yes | no known active call | not_run | legacy launch model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:launch/launch_model.py` |
| `launch/launcher_db.csv` | `34743d83785bbc8500cd3cafd7f9dbdae6e5aced` | no | no | not_run | legacy model data | legacy unresolved | `git show legacy/pre-orbital-compute-lab:launch/launcher_db.csv` |
| `main.py` | `61570ad3e1b05cb1936c94e669ecdd2f3cbdf2e3` | yes | no known active call, contains local path | not_run | legacy trade-study source | legacy unresolved | `git show legacy/pre-orbital-compute-lab:main.py` |
| `orbits/eclipse.py` | `382e2b5119f7c9d0c74755c9bb1aba08e33d1c39` | yes | no known active call | not_run | legacy orbital model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:orbits/eclipse.py` |
| `power/power_model.py` | `171a5872064ef9bb9b21713ba1a5b5a98fff9256` | yes | no known active call | not_run | legacy power model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:power/power_model.py` |
| `power/solid_state_model.py` | `356dd36f86b31359796b3b8a180f8dc17babd111` | yes | no known active call | not_run | legacy mining model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:power/solid_state_model.py` |
| `radiation/Thermal.py` | `dea41ed4d1494a3a4a65cb73e4c3b8f9f53ea7f9` | yes | no known active call | not_run | legacy thermal model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:radiation/Thermal.py` |
| `radiation/rf_model.py` | `82103b5bd37a72da67e779158f32ffa23c6729c3` | yes | static provider-named data | not_run | legacy RF model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:radiation/rf_model.py` |
| `radiation/tid_model.py` | `be4f0ad1ebad3cbb3856910125367f00b70c3ab2` | yes | no known active call | not_run | legacy radiation model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:radiation/tid_model.py` |
| `radiation/via_model.py` | `9993b985ccfe33f1a393208232c7f010fd3c82d0` | yes | no known active call | not_run | legacy via model | legacy unresolved | `git show legacy/pre-orbital-compute-lab:radiation/via_model.py` |
| `readme.txt` | `402f42f8d4940404bc3b4149dcd026b5c7168592` | no | mentions local Flask URL and package install | not_run | legacy instructions | legacy unresolved | `git show legacy/pre-orbital-compute-lab:readme.txt` |
| `render.yaml` | `ffd9bfacf20307e01be661d70815608e3615fbc9` | no | yes, Render build/start commands | not_run | legacy deployment config | legacy unresolved | `git show legacy/pre-orbital-compute-lab:render.yaml` |
| `requirements.txt` | `190db8050fdc3b7e60a1df4cd0dc3971cbf3dec7` | no | dependency installation surface | not_run | legacy dependency list | legacy unresolved | `git show legacy/pre-orbital-compute-lab:requirements.txt` |
| `templates/index.html` | `655168afa989e62eb254a9d54cfbd242749ce48d` | yes | browser-side legacy app behavior | not_run | legacy Flask template | legacy unresolved | `git show legacy/pre-orbital-compute-lab:templates/index.html` |

Reviewer disposition for every planned deletion: approved. The read-only
deletion-plan reviewer reported no findings and confirmed that retained
audit/provenance/licensing coverage remains available.

## Blocked Pending Investigation

None. The planned deletion list is limited to paths already described by the I0
audit as legacy source, legacy deployment material, legacy dependency material,
legacy local-path material, or legacy conflicted license material.

## Future Retrieval Method

Use read-only Git inspection. Example:

```powershell
git show legacy/pre-orbital-compute-lab:app.py
```

Do not execute legacy source when retrieving it.
