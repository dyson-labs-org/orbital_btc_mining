# Audit Report

## Scope

Repository: `dyson-labs-org/orbital_btc_mining`.

Baseline SHA: `c93c7366edcd86b83896c3c39b753805183c3126`.

Preserved branch: `legacy/pre-orbital-compute-lab`.

Work branch: `incubation/orbital-compute-lab-charter`.

Audit date: 2026-06-23.

## Baseline Finding

The observed repository is not a gf-sdk JavaScript or TypeScript monorepo. It is
a Python Flask/Render orbital Bitcoin-mining trade-study application with
analysis scripts. This mismatch is recorded as an audit finding. No legacy
runtime command was executed to reconcile the mismatch.

## Static Command Audit

Status: passed for static inspection, not_run for legacy execution.

No legacy app command, package install, server, Render command, Google helper,
email helper, portal health check, invoice command, integration command, smoke
command, dispatch command, executor command, or package-manager script was run.

The detailed command surface is in [legacy-inventory.md](legacy-inventory.md).

## Credential And Secret Scan

Status: passed_with_findings.

Current tree and reachable history were scanned with redacted patterns for
private-key markers, AWS access keys, Google API keys, GitHub tokens, Slack
tokens, Stripe live keys, and generic secret assignments. No likely active credential was found by that scan.

Environment-variable references were found in:

- `analysis/lastrow.py` for `SENDER_EMAIL`.
- `analysis/lastrow.py` for `APP_PASSWORD`.
- `app.py` for `PORT`.

These are references only, not committed secret values.

## Privacy And Provenance Findings

Status: passed_with_findings.

Git history records deleted `user_reports/*.pdf` paths containing email
addresses. The files are not present in the current tree, but the history and
filenames are a privacy/provenance concern for future cleanup planning.

The current tree also contains local absolute Windows paths in legacy source.

## License Finding

Status: failed for clean license provenance, accepted as documented I0 gap.

`LICENSE` contains MIT license text with unresolved merge conflict markers. I0
does not alter the file because this milestone is an audit/re-charter step with
no legacy cleanup. A future reviewed cleanup must resolve the license file before
any operational or distribution claim.

## gf-sdk Duplication Assessment

Status: passed for static comparison.

Referenced repository: `dyson-labs-org/gf-sdk`.

Observed gf-sdk HEAD: `ccdff5326cfd8f4b4123faebbeac477bb3d1235f`.

Read-only comparison results:

- Orbital tracked files: 32.
- gf-sdk tracked files: 55.
- Common paths: `.gitignore`, `LICENSE`.
- Exact matching common-path hashes: 0.
- Common basenames: `.gitignore`, `LICENSE`.

No evidence of copied gf-sdk source was found in this static comparison. This is
not a full authorship proof; it is a scoped repository/file-shape and exact-hash
assessment.

## External Endpoint And Service Findings

Status: passed_with_findings.

Legacy files reference Render, Google OAuth/Sheets, email delivery, a local
Flask URL, a GitHub URL, and static AWS-named ground-station data. These are
documented as legacy references and are outside I0 execution.

## Release-Gate Classification

I0 advances only the audit/re-charter gate for an incubation repository. It does not advance an operational pilot gate, a deployment gate, a mining gate, or a customer-readiness gate.

## Open Follow-Ups

- Resolve or replace the conflicted `LICENSE` file.
- Decide how to handle historical personal-data filenames.
- Quarantine or replace legacy external-service scripts.
- Replace legacy app assumptions with deterministic offline simulation fixtures.
- Add model validation data before any technical performance claim.
