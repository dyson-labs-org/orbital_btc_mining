import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  runScenarioSuiteDocument,
  suiteRunPayload,
  validateScenarioSuiteDocument
} from "../../src/domain/scenario-suite.mjs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function validate(path) {
  return validateScenarioSuiteDocument(read(path));
}

function run(path) {
  return runScenarioSuiteDocument(read(path));
}

function assertError(path, code) {
  const result = validate(path);
  assert.equal(result.ok, false, `${path} should be invalid`);
  assert.ok(result.errors.some((error) => error.code === code), `${code} not found in ${JSON.stringify(result.errors)}`);
  return result;
}

test("valid all-completed suite", () => {
  const result = run("fixtures/suites/core-resource-regression.v1.json");
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "passed");
  assert.equal(result.passed_case_count, 2);
  assert.deepEqual(result.cases.map((item) => item.actual_outcome), ["completed", "completed"]);
});

test("valid mixed completed and constraint suite", () => {
  const result = run("fixtures/suites/constraint-regression.v1.json");
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "passed");
  assert.deepEqual(result.cases.map((item) => item.actual_constraint_codes), [
    ["ENERGY_DEFICIT"],
    ["THERMAL_CAPACITY_EXCEEDED"],
    ["ENERGY_DEFICIT", "THERMAL_CAPACITY_EXCEEDED"]
  ]);
});

test("case order is preserved", () => {
  const result = run("fixtures/suites/constraint-regression.v1.json");
  assert.deepEqual(result.cases.map((item) => item.case_id), [
    "energy-deficit",
    "thermal-capacity",
    "combined-constraints"
  ]);
});

test("duplicate case IDs are rejected", () => {
  assertError("fixtures/suites/invalid/duplicate-case-id.v1.json", "duplicate_case_id");
});

test("absolute paths are rejected", () => {
  assertError("fixtures/suites/invalid/absolute-path.v1.json", "absolute_path");
});

test("traversal paths are rejected", () => {
  assertError("fixtures/suites/invalid/traversal-path.v1.json", "path_traversal");
});

test("fixture-root escape is rejected", () => {
  assertError("fixtures/suites/invalid/fixture-root-escape.v1.json", "path_outside_fixture_root");
});

test("unknown fields are rejected", () => {
  assertError("fixtures/suites/invalid/unknown-field.v1.json", "unknown_field");
});

test("invalid expected outcome is rejected", () => {
  assertError("fixtures/suites/invalid/invalid-outcome.v1.json", "invalid_expected_outcome");
});

test("duplicate expected constraint codes are rejected", () => {
  assertError("fixtures/suites/invalid/duplicate-constraint-code.v1.json", "duplicate_constraint_code");
});

test("missing scenario fails execution", () => {
  const result = run("fixtures/suites/invalid/missing-scenario.v1.json");
  assert.equal(result.ok, false);
  assert.equal(result.process_status, "invalid_input");
  assert.ok(result.errors.some((error) => error.code === "scenario_file_not_found"));
});

test("invalid referenced scenario fails execution", () => {
  const result = run("fixtures/suites/invalid/invalid-scenario.v1.json");
  assert.equal(result.ok, false);
  assert.equal(result.process_status, "invalid_input");
  assert.ok(result.errors.some((error) => error.code === "negative_integer"));
});

test("expected constraint-code comparison is ordered", () => {
  const result = run("fixtures/suites/constraint-regression.v1.json");
  const combined = result.cases.find((item) => item.case_id === "combined-constraints");
  assert.deepEqual(combined.expected_constraint_codes, ["ENERGY_DEFICIT", "THERMAL_CAPACITY_EXCEEDED"]);
  assert.deepEqual(combined.actual_constraint_codes, ["ENERGY_DEFICIT", "THERMAL_CAPACITY_EXCEEDED"]);
  assert.equal(combined.matched, true);
});

test("expectation mismatch produces failed suite result", () => {
  const result = run("fixtures/suites/invalid/expectation-mismatch.v1.json");
  assert.equal(result.ok, true);
  assert.equal(result.outcome, "failed");
  assert.equal(result.failed_case_count, 1);
  assert.deepEqual(result.cases[0].failure_codes, ["outcome_mismatch", "constraint_codes_mismatch"]);
});

test("deterministic repeated output", () => {
  const first = suiteRunPayload(run("fixtures/suites/constraint-regression.v1.json"));
  const second = suiteRunPayload(run("fixtures/suites/constraint-regression.v1.json"));
  const third = suiteRunPayload(run("fixtures/suites/constraint-regression.v1.json"));
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test("suite validation writes no files and imports no network or subprocess modules", () => {
  const before = fs.readdirSync("fixtures/suites").sort();
  validate("fixtures/suites/core-resource-regression.v1.json");
  const after = fs.readdirSync("fixtures/suites").sort();
  assert.deepEqual(after, before);

  const source = fs.readFileSync("src/domain/scenario-suite.mjs", "utf8");
  assert.doesNotMatch(source, /node:(?:http|https|net|tls|dns|dgram|child_process)|\bfetch\s*\(|\bWebSocket\s*\(|writeFile|appendFile|mkdir|rm\(/);
});
