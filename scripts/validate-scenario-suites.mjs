#!/usr/bin/env node
import process from "node:process";
import { createHash } from "node:crypto";
import { runScenarioSuiteFile, suiteRunPayload, validateScenarioSuiteFile } from "../src/domain/scenario-suite.mjs";

const failures = [];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function payloadJson(result) {
  return JSON.stringify(suiteRunPayload(result));
}

const core = runScenarioSuiteFile("fixtures/suites/core-resource-regression.v1.json");
if (!core.ok || core.outcome !== "passed" || core.case_count !== 2) {
  failures.push(`core suite should pass: ${JSON.stringify(core.errors)}`);
}

const constraints = runScenarioSuiteFile("fixtures/suites/constraint-regression.v1.json");
if (!constraints.ok || constraints.outcome !== "passed" || constraints.case_count !== 3) {
  failures.push(`constraint suite should pass: ${JSON.stringify(constraints.errors)}`);
}

const mismatch = runScenarioSuiteFile("fixtures/suites/invalid/expectation-mismatch.v1.json");
if (!mismatch.ok || mismatch.outcome !== "failed" || mismatch.failed_case_count !== 1) {
  failures.push("expectation mismatch suite should run and report failed expectations");
}

const invalidFixtures = new Map([
  ["fixtures/suites/invalid/duplicate-case-id.v1.json", "duplicate_case_id"],
  ["fixtures/suites/invalid/absolute-path.v1.json", "absolute_path"],
  ["fixtures/suites/invalid/traversal-path.v1.json", "path_traversal"],
  ["fixtures/suites/invalid/fixture-root-escape.v1.json", "path_outside_fixture_root"],
  ["fixtures/suites/invalid/unknown-field.v1.json", "unknown_field"],
  ["fixtures/suites/invalid/invalid-outcome.v1.json", "invalid_expected_outcome"],
  ["fixtures/suites/invalid/duplicate-constraint-code.v1.json", "duplicate_constraint_code"]
]);

for (const [fixture, code] of invalidFixtures) {
  const result = validateScenarioSuiteFile(fixture);
  if (result.ok || !result.errors.some((error) => error.code === code)) {
    failures.push(`${fixture} should fail with ${code}`);
  }
}

const repeatedA = payloadJson(runScenarioSuiteFile("fixtures/suites/constraint-regression.v1.json"));
const repeatedB = payloadJson(runScenarioSuiteFile("fixtures/suites/constraint-regression.v1.json"));
const repeatedC = payloadJson(runScenarioSuiteFile("fixtures/suites/constraint-regression.v1.json"));
if (repeatedA !== repeatedB || repeatedB !== repeatedC) {
  failures.push("scenario suite JSON output must be deterministic across repeated runs");
}

const summary = {
  validator: "scenario-suites",
  status: failures.length === 0 ? "passed" : "failed",
  schema_version: "scenario-suite.v1",
  valid_suite_count: 2,
  expected_negative_fixture_count: invalidFixtures.size,
  all_completed_suite: core.outcome ?? "not_run",
  constraint_suite: constraints.outcome ?? "not_run",
  expected_mismatch_failure: mismatch.outcome === "failed" ? "passed" : "failed",
  deterministic_suite_json: failures.length === 0 ? "passed" : "failed",
  deterministic_suite_json_sha256: hash(repeatedA),
  scheduler: "not_implemented",
  bitcoin_workload: "not_implemented",
  ai_workload: "not_implemented",
  external_service_calls: "none",
  failures
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
