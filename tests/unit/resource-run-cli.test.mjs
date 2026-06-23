import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const nominalPath = "fixtures/runs/nominal-resource-run.v1.json";
const constraintPath = "fixtures/runs/energy-deficit.v1.json";
const overflowPath = "fixtures/runs/arithmetic-overflow.v1.json";
const malformedPath = "fixtures/scenarios/invalid/malformed-json.v1.json";
const invalidContractPath = "fixtures/scenarios/invalid/negative-energy.v1.json";

function run(args) {
  return spawnSync(process.execPath, ["src/cli.mjs", ...args], { encoding: "utf8" });
}

test("CLI nominal exit 0", () => {
  const result = run(["run-scenario", nominalPath]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /completed resource scenario/);
  assert.equal(result.stderr, "");
});

test("CLI nominal JSON exit 0", () => {
  const result = run(["run-scenario", nominalPath, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.result.outcome, "completed");
});

test("CLI constraint-violation exit 0", () => {
  const result = run(["run-scenario", constraintPath, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.result.outcome, "constraint_violation");
});

test("CLI malformed input nonzero", () => {
  const result = run(["run-scenario", malformedPath]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /invalid_json/);
  assert.doesNotMatch(result.stderr, /SyntaxError/);
});

test("CLI contract-invalid input nonzero", () => {
  const result = run(["run-scenario", invalidContractPath, "--json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.errors.some((error) => error.code === "negative_integer"));
});

test("CLI arithmetic overflow nonzero", () => {
  const result = run(["run-scenario", overflowPath, "--json"]);
  assert.equal(result.status, 3);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.process_status, "internal_error");
  assert.equal(payload.errors[0].code, "arithmetic_overflow");
});

test("CLI missing file nonzero", () => {
  const result = run(["run-scenario", "fixtures/runs/missing.v1.json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /scenario_file_not_found/);
  assert.doesNotMatch(result.stderr, /Error:/);
});

test("CLI unsupported option nonzero", () => {
  const result = run(["run-scenario", nominalPath, "--yaml"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown run-scenario option/);
});

test("JSON stdout purity and deterministic output", () => {
  const first = run(["run-scenario", constraintPath, "--json"]);
  const second = run(["run-scenario", constraintPath, "--json"]);
  const third = run(["run-scenario", constraintPath, "--json"]);
  assert.equal(first.stderr, "");
  assert.equal(first.stdout, second.stdout);
  assert.equal(second.stdout, third.stdout);
  assert.doesNotThrow(() => JSON.parse(first.stdout));
});

test("CLI validation writes no files", () => {
  const before = fs.readdirSync("fixtures/runs").sort();
  const result = run(["run-scenario", nominalPath, "--json"]);
  assert.equal(result.status, 0);
  const after = fs.readdirSync("fixtures/runs").sort();
  assert.deepEqual(after, before);
});

test("status capability honesty", () => {
  const result = run(["status", "--json"]);
  assert.equal(result.status, 0);
  const status = JSON.parse(result.stdout);
  assert.equal(status.capabilities.resource_scenario_contract, true);
  assert.equal(status.capabilities.resource_scenario_validation, true);
  assert.equal(status.capabilities.deterministic_resource_transition, true);
  assert.equal(status.capabilities.workload_scheduler, false);
  assert.equal(status.capabilities.bitcoin_workload_model, false);
  assert.equal(status.capabilities.ai_workload_model, false);
});
