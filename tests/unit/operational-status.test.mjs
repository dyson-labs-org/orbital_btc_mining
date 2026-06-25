import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  OPERATIONAL_STATUS_CAPABILITY_KEYS,
  OPERATIONAL_STATUS_SCHEMA_VERSION,
  getStatus,
  validateOperationalStatus
} from "../../src/index.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertInvalid(mutator, expectedCode, expectedPath) {
  const status = clone(getStatus());
  mutator(status);
  const result = validateOperationalStatus(status);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((item) => item.code === expectedCode && item.path === expectedPath),
    `expected ${expectedCode} at ${expectedPath}, got ${JSON.stringify(result.errors)}`
  );
}

test("current status conforms to operational-status.v1", () => {
  const status = getStatus();
  const result = validateOperationalStatus(status);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(status.schema_version, OPERATIONAL_STATUS_SCHEMA_VERSION);
  assert.deepEqual(Object.keys(status.capabilities), OPERATIONAL_STATUS_CAPABILITY_KEYS);
});

test("CLI status JSON conforms and matches in-process status", () => {
  const first = execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], { encoding: "utf8" });
  const second = execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], { encoding: "utf8" });
  assert.equal(first, second);
  const parsed = JSON.parse(first);
  assert.deepEqual(parsed, getStatus());
  assert.equal(validateOperationalStatus(parsed).ok, true);
});

test("status text and help remain capability-honest", () => {
  const status = execFileSync(process.execPath, ["src/cli.mjs", "status"], { encoding: "utf8" });
  assert.match(status, /status: controlled_test_range/);
  assert.match(status, /resource scenario contract: implemented/);
  assert.match(status, /scenario suite runner: implemented/);
  assert.match(status, /simulation: not implemented/);
  assert.match(status, /external network: none/);

  const help = execFileSync(process.execPath, ["src/cli.mjs", "help"], { encoding: "utf8" });
  assert.match(help, /status --json/);
  assert.match(help, /No simulation kernel/);
});

test("rejects non-object root", () => {
  const result = validateOperationalStatus(null);
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, [
    { code: "invalid_root", path: "$", message: "Operational status must be an object." }
  ]);
});

test("rejects missing root fields", () => {
  for (const field of ["schema_version", "product_name", "repository", "maturity", "implementation_status", "runtime", "version", "capabilities"]) {
    assertInvalid((status) => { delete status[field]; }, "missing_field", `$.${field}`);
  }
});

test("rejects unknown root field and wrong constants", () => {
  assertInvalid((status) => { status.extra = true; }, "unknown_field", "$.extra");
  assertInvalid((status) => { status.schema_version = "1.0"; }, "invalid_constant", "$.schema_version");
  assertInvalid((status) => { status.product_name = ""; }, "invalid_string", "$.product_name");
  assertInvalid((status) => { status.product_name = "Other"; }, "invalid_constant", "$.product_name");
  assertInvalid((status) => { status.repository = "other/repo"; }, "invalid_constant", "$.repository");
  assertInvalid((status) => { status.maturity = "production"; }, "invalid_constant", "$.maturity");
  assertInvalid((status) => { status.implementation_status = "complete"; }, "invalid_constant", "$.implementation_status");
  assertInvalid((status) => { status.version = ""; }, "invalid_version", "$.version");
  assertInvalid((status) => { status.version = "v0"; }, "invalid_version", "$.version");
});

test("rejects malformed runtime", () => {
  assertInvalid((status) => { status.runtime = null; }, "invalid_runtime", "$.runtime");
  assertInvalid((status) => { delete status.runtime.name; }, "missing_field", "$.runtime.name");
  assertInvalid((status) => { delete status.runtime.minimum_version; }, "missing_field", "$.runtime.minimum_version");
  assertInvalid((status) => { status.runtime.extra = "x"; }, "unknown_field", "$.runtime.extra");
  assertInvalid((status) => { status.runtime.name = ""; }, "invalid_string", "$.runtime.name");
  assertInvalid((status) => { status.runtime.name = "python"; }, "invalid_constant", "$.runtime.name");
  assertInvalid((status) => { status.runtime.minimum_version = 22; }, "invalid_string", "$.runtime.minimum_version");
});

test("rejects malformed capabilities", () => {
  assertInvalid((status) => { status.capabilities = []; }, "invalid_capabilities", "$.capabilities");
  assertInvalid((status) => { delete status.capabilities.resource_scenario_contract; }, "missing_field", "$.capabilities.resource_scenario_contract");
  assertInvalid((status) => { status.capabilities.extra = false; }, "unknown_field", "$.capabilities.extra");
  assertInvalid((status) => { status.capabilities.wallet = "false"; }, "invalid_capability_value", "$.capabilities.wallet");
});

test("rejects implemented capabilities changed to false", () => {
  for (const key of [
    "resource_scenario_contract",
    "resource_scenario_validation",
    "deterministic_resource_transition",
    "scenario_suite_contract",
    "scenario_suite_runner",
    "resource_trace_summary"
  ]) {
    assertInvalid((status) => { status.capabilities[key] = false; }, "dishonest_capability", `$.capabilities.${key}`);
  }
});

test("rejects unimplemented capabilities changed to true", () => {
  for (const key of [
    "simulation_kernel",
    "workload_scheduler",
    "bitcoin_workload_model",
    "ai_workload_model",
    "external_network",
    "wallet",
    "hardware_control",
    "mission_authority"
  ]) {
    assertInvalid((status) => { status.capabilities[key] = true; }, "dishonest_capability", `$.capabilities.${key}`);
  }
});

test("error ordering is deterministic", () => {
  const status = clone(getStatus());
  delete status.schema_version;
  status.alpha = true;
  status.capabilities.wallet = true;
  const first = validateOperationalStatus(status).errors;
  const second = validateOperationalStatus(status).errors;
  assert.deepEqual(first, second);
});

test("validator does not mutate caller input", () => {
  const status = clone(getStatus());
  const before = JSON.stringify(status);
  validateOperationalStatus(status);
  assert.equal(JSON.stringify(status), before);
});
