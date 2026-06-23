# Verification Plan

## I0 Verification Contract

`.\eng.ps1 bootstrap` must:

- create no artifacts;
- perform no package installation;
- call no network service;
- run no legacy application command;
- report legacy source as `not_run`;
- report external calls as `none`;
- report product implementation as `not_started`.

`.\eng.ps1 verify` must run only:

- `git diff --check`;
- `node scripts/validate-incubation-charter.mjs`;
- `node --test tests/incubation-charter.test.mjs`.

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
- Validator output.
- Node test output.
- `git diff --check` result.
- Redacted static secret scan summary.
- Static command audit summary.

Generated evidence belongs under ignored artifact directories such as
`.agent-harness/artifacts/` or `audit-output/`.

## Out-Of-Scope Checks For I0

- Legacy Flask app execution.
- Python dependency installation.
- Render deployment.
- Google Sheets or email workflows.
- Portal health, invoice, smoke, integration, dispatch, or executor checks.
- Performance, economics, or scientific correctness claims.
