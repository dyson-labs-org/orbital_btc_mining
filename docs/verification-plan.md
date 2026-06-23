# Verification Plan

## I0.5 Verification Contract

`.\eng.ps1 bootstrap` must:

- locate the repository with `$PSScriptRoot`;
- check Git, PowerShell, and Node.js;
- require Node.js 22 or newer;
- perform no package installation;
- call no network service;
- create no artifact;
- check that the legacy branch reference is documented;
- report product implementation as `skeleton`.

`.\eng.ps1 verify` must run only:

- bootstrap checks;
- `git diff --check`;
- `node scripts/validate-incubation-charter.mjs`;
- `node scripts/validate-clean-skeleton.mjs`;
- `node --test`;
- `node src/cli.mjs status --json`.

The wrapper must report:

- charter status: `incubation`;
- skeleton status: `skeleton`;
- legacy source status: `preserved_not_executed`;
- dependency installation: `not_required`;
- external service calls: `none`;
- simulation kernel: `not_implemented`;
- Bitcoin behavior: `not_implemented`;
- AI behavior: `not_implemented`.

## Status Vocabulary

- `passed`: check executed and met its condition.
- `failed`: check executed and did not meet its condition.
- `skipped`: intentionally skipped with a stated reason.
- `not_run`: execution was not attempted.
- `empty`: the expected surface does not exist.
- `noop`: command ran but had no state-changing work to do.

## Required Local Evidence

- Harness bootstrap summary.
- Harness verify summary.
- Charter validator output.
- Clean-skeleton validator output.
- Node test output and test count.
- CLI status output.
- `git diff --check` result.
- Deletion-plan and recovery evidence.
- Redacted boundary scans.

Generated evidence belongs under ignored artifact directories such as
`.agent-harness/artifacts/` or `audit-output/`.

## Out-Of-Scope Checks For I0.5

- Legacy source execution.
- Python dependency installation.
- Package-manager installation.
- Render deployment.
- Google Sheets or email workflows.
- Portal health, invoice, smoke, integration, dispatch, or executor checks.
- Performance, economics, scientific correctness, profitability, or orbital
  feasibility claims.
