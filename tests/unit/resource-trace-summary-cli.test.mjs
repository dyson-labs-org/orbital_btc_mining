import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const nominalPath = "fixtures/runs/nominal-resource-run.v1.json";
const constraintPath = "fixtures/runs/energy-deficit.v1.json";
const malformedPath = "fixtures/scenarios/invalid/malformed-json.v1.json";
const invalidContractPath = "fixtures/scenarios/invalid/negative-energy.v1.json";

function run(args) {
  return spawnSync(process.execPath, ["src/cli.mjs", ...args], { encoding: "utf8" });
}

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

test("CLI summary text exit 0", () => {
  const result = run(["summarize-scenario", nominalPath]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /resource trace summary: nominal-resource-run/);
  assert.match(result.stdout, /total duration ms: 2000/);
  assert.match(result.stdout, /constraints: none/);
});

test("CLI summary JSON exit 0", () => {
  const result = run(["summarize-scenario", nominalPath, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema_version, "resource-trace-summary-run.v1");
  assert.equal(payload.ok, true);
  assert.equal(payload.process_status, "domain_success");
  assert.deepEqual(payload.summary, loadJson("fixtures/summaries/nominal-resource-run-summary.v1.json"));
});

test("CLI constraint summary JSON exit 0", () => {
  const result = run(["summarize-scenario", constraintPath, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.outcome, "constraint_violation");
  assert.deepEqual(payload.summary.constraint_summary, [
    { code: "ENERGY_DEFICIT", count: 1, total_amount_millijoules: 30 }
  ]);
});

test("CLI malformed input nonzero", () => {
  const result = run(["summarize-scenario", malformedPath]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /invalid_json/);
  assert.doesNotMatch(result.stderr, /SyntaxError/);
});

test("CLI contract-invalid input nonzero", () => {
  const result = run(["summarize-scenario", invalidContractPath, "--json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.summary, null);
  assert.ok(payload.errors.some((error) => error.code === "negative_integer"));
});

test("CLI missing file nonzero", () => {
  const result = run(["summarize-scenario", "fixtures/runs/missing.v1.json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /scenario_file_not_found/);
  assert.doesNotMatch(result.stderr, /Error:/);
});

test("CLI unsupported option nonzero", () => {
  const result = run(["summarize-scenario", nominalPath, "--yaml"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown summarize-scenario option/);
});

test("JSON stdout purity and deterministic output", () => {
  const first = run(["summarize-scenario", constraintPath, "--json"]);
  const second = run(["summarize-scenario", constraintPath, "--json"]);
  const third = run(["summarize-scenario", constraintPath, "--json"]);
  assert.equal(first.stderr, "");
  assert.equal(first.stdout, second.stdout);
  assert.equal(second.stdout, third.stdout);
  assert.doesNotThrow(() => JSON.parse(first.stdout));
});

test("text output is deterministic", () => {
  const first = run(["summarize-scenario", constraintPath]);
  const second = run(["summarize-scenario", constraintPath]);
  assert.equal(first.status, 0);
  assert.equal(first.stdout, second.stdout);
  assert.match(first.stdout, /ENERGY_DEFICIT: count=1 total_amount_millijoules=30/);
});

test("CLI summary execution writes no files", () => {
  const before = fs.readdirSync("fixtures/runs").sort();
  const result = run(["summarize-scenario", nominalPath, "--json"]);
  assert.equal(result.status, 0);
  const after = fs.readdirSync("fixtures/runs").sort();
  assert.deepEqual(after, before);
});

test("status capability honesty includes resource trace summaries without overstatement", () => {
  const result = run(["status", "--json"]);
  assert.equal(result.status, 0);
  const status = JSON.parse(result.stdout);
  assert.equal(status.capabilities.resource_trace_summary, true);
  assert.equal(status.capabilities.simulation_kernel, false);
  assert.equal(status.capabilities.workload_scheduler, false);
  assert.equal(status.capabilities.bitcoin_workload_model, false);
  assert.equal(status.capabilities.ai_workload_model, false);
  assert.equal(status.capabilities.external_network, false);
  assert.equal(status.capabilities.wallet, false);
  assert.equal(status.capabilities.hardware_control, false);
  assert.equal(status.capabilities.mission_authority, false);
});
