import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const coreSuite = "fixtures/suites/core-resource-regression.v1.json";
const constraintSuite = "fixtures/suites/constraint-regression.v1.json";
const mismatchSuite = "fixtures/suites/invalid/expectation-mismatch.v1.json";
const malformedSuite = "fixtures/suites/invalid/unknown-field.v1.json";

function run(args) {
  return spawnSync(process.execPath, ["src/cli.mjs", ...args], { encoding: "utf8" });
}

test("CLI suite success exit 0", () => {
  const result = run(["run-suite", coreSuite]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /passed scenario suite/);
  assert.equal(result.stderr, "");
});

test("CLI suite JSON success exit 0", () => {
  const result = run(["run-suite", coreSuite, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.outcome, "passed");
  assert.equal(payload.case_count, 2);
});

test("CLI expected-domain-constraint suite exit 0", () => {
  const result = run(["run-suite", constraintSuite, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.outcome, "passed");
  assert.deepEqual(payload.cases[0].actual_constraint_codes, ["ENERGY_DEFICIT"]);
});

test("CLI expectation mismatch nonzero", () => {
  const result = run(["run-suite", mismatchSuite, "--json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.outcome, "failed");
  assert.deepEqual(payload.cases[0].failure_codes, ["outcome_mismatch", "constraint_codes_mismatch"]);
});

test("CLI malformed suite nonzero with stderr diagnostics", () => {
  const result = run(["run-suite", malformedSuite]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /unknown_field/);
});

test("CLI unsupported option nonzero", () => {
  const result = run(["run-suite", coreSuite, "--yaml"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown run-suite option/);
});

test("JSON stdout purity and deterministic output", () => {
  const first = run(["run-suite", constraintSuite, "--json"]);
  const second = run(["run-suite", constraintSuite, "--json"]);
  const third = run(["run-suite", constraintSuite, "--json"]);
  assert.equal(first.stderr, "");
  assert.equal(first.stdout, second.stdout);
  assert.equal(second.stdout, third.stdout);
  assert.doesNotThrow(() => JSON.parse(first.stdout));
});

test("CLI suite execution writes no files", () => {
  const before = fs.readdirSync("fixtures/suites").sort();
  const result = run(["run-suite", coreSuite, "--json"]);
  assert.equal(result.status, 0);
  const after = fs.readdirSync("fixtures/suites").sort();
  assert.deepEqual(after, before);
});

test("status capability honesty includes suites without overstatement", () => {
  const result = run(["status", "--json"]);
  assert.equal(result.status, 0);
  const status = JSON.parse(result.stdout);
  assert.equal(status.capabilities.scenario_suite_contract, true);
  assert.equal(status.capabilities.scenario_suite_runner, true);
  assert.equal(status.capabilities.workload_scheduler, false);
  assert.equal(status.capabilities.bitcoin_workload_model, false);
  assert.equal(status.capabilities.ai_workload_model, false);
  assert.equal(status.capabilities.external_network, false);
});
