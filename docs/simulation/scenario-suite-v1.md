# Scenario Suite v1

`scenario-suite.v1` is a deterministic regression contract for running multiple
existing resource scenarios through the resource-transition engine.

It is not a scheduler, optimizer, simulation kernel, workload model, Bitcoin
system, AI workload, telemetry surface, network workflow, hardware controller, or
mission-planning tool.

## Document Shape

Required root fields:

- `schema_version`: exactly `scenario-suite.v1`.
- `suite_id`: nonempty string.
- `cases`: nonempty array.

Required case fields:

- `case_id`: nonempty string unique within the suite.
- `scenario_path`: normalized repository-relative path under `fixtures/runs/`.
- `expected_outcome`: one of `completed` or `constraint_violation`.

Optional case fields:

- `expected_constraint_codes`: array of unique nonempty strings. When present,
  order is explicit and must match the resource-transition result exactly. When
  absent, the suite asserts only the domain outcome.

Unknown fields are rejected. Implicit defaults must not hide malformed input.

## Path Rules

`scenario_path` is interpreted from the repository root and must use normalized
forward-slash form. Absolute paths, drive-qualified paths, UNC paths, empty
segments, `.` segments, `..` traversal, and paths outside `fixtures/runs/` are
rejected.

The runner reads only the referenced scenario files. It must not discover
fixtures dynamically, write files, use wall-clock values, use randomness, call
the network, spawn subprocesses, or create provider-generated expectations.

## Execution Semantics

For each case, the runner:

1. reads and validates the referenced `resource-scenario.v1` document;
2. runs the existing deterministic resource-transition engine;
3. compares the actual domain outcome with `expected_outcome`;
4. compares actual constraint codes with `expected_constraint_codes` when that
   field is present;
5. records a deterministic case result without changing resource-scenario or
   resource-transition semantics.

Suite outcome is `passed` only when every case expectation matches. It is
`failed` when any expectation does not match.

A scenario-domain `constraint_violation` can satisfy a suite when it is the
expected outcome. An expectation mismatch is a failed command execution because
the regression assertion did not hold.

## Process Exit Semantics

- valid suite with all expectations matched: exit `0`;
- valid suite containing expected `constraint_violation` cases that match:
  exit `0`;
- valid suite with an expectation mismatch: nonzero;
- malformed suite: nonzero;
- invalid referenced scenario: nonzero;
- missing referenced scenario: nonzero;
- unsupported option: nonzero;
- unexpected internal resource-transition error: distinct nonzero result.

## Deterministic Output

JSON output uses stable field order, stable case order, no timestamps, no random
IDs, no environment values, and no local absolute paths.

Each case result records:

- `case_id`;
- `scenario_path`;
- `expected_outcome`;
- `actual_outcome`;
- `expected_constraint_codes`;
- `actual_constraint_codes`;
- `matched`;
- stable failure codes when unmatched.

The suite result records:

- `schema_version`;
- `suite_id`;
- `outcome`;
- `case_count`;
- `passed_case_count`;
- `failed_case_count`;
- `cases`.

## Scientific Limitations

Scenario suites only orchestrate existing deterministic fixtures. They do not
prove orbital realism, scheduling quality, profitability, hardware feasibility,
mission safety, or operational readiness.
