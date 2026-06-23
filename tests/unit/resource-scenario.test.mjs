import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  parseScenarioJson,
  validateResourceScenario
} from "../../src/domain/resource-scenario.mjs";

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertValid(path) {
  const result = validateResourceScenario(loadJson(path));
  assert.equal(result.ok, true, `${path} should be valid: ${JSON.stringify(result.errors)}`);
  assert.deepEqual(result.errors, []);
}

function assertError(pathOrObject, code) {
  const scenario = typeof pathOrObject === "string" ? loadJson(pathOrObject) : pathOrObject;
  const result = validateResourceScenario(scenario);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === code), `${code} not found in ${JSON.stringify(result.errors)}`);
  return result;
}

test("valid minimal scenario", () => {
  assertValid("fixtures/scenarios/minimal-sunlit.v1.json");
});

test("valid eclipse transition", () => {
  assertValid("fixtures/scenarios/eclipse-transition.v1.json");
});

test("valid communications window", () => {
  assertValid("fixtures/scenarios/communications-window.v1.json");
});

test("deterministic repeated validation", () => {
  const scenario = loadJson("fixtures/scenarios/minimal-sunlit.v1.json");
  const first = validateResourceScenario(scenario);
  const second = validateResourceScenario(scenario);
  const third = validateResourceScenario(scenario);
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test("strict schema version", () => {
  const scenario = loadJson("fixtures/scenarios/minimal-sunlit.v1.json");
  scenario.schema_version = "resource-scenario.v2";
  assertError(scenario, "invalid_schema_version");
});

test("unknown-field rejection", () => {
  assertError("fixtures/scenarios/invalid/unknown-field.v1.json", "unknown_field");
});

test("negative-value rejection", () => {
  assertError("fixtures/scenarios/invalid/negative-energy.v1.json", "negative_integer");
});

test("float rejection", () => {
  assertError("fixtures/scenarios/invalid/float-value.v1.json", "invalid_integer");
});

test("unsafe-integer rejection", () => {
  assertError("fixtures/scenarios/invalid/unsafe-integer.v1.json", "invalid_integer");
});

test("battery capacity invariant", () => {
  assertError("fixtures/scenarios/invalid/battery-over-capacity.v1.json", "battery_over_capacity");
});

test("thermal capacity invariant", () => {
  const scenario = loadJson("fixtures/scenarios/minimal-sunlit.v1.json");
  scenario.initial_state.thermal_load_millijoules = 600;
  assertError(scenario, "thermal_over_capacity");
});

test("contiguous step invariant", () => {
  assertError("fixtures/scenarios/invalid/noncontiguous-steps.v1.json", "step_index_mismatch");
});

test("environment length invariant", () => {
  const scenario = loadJson("fixtures/scenarios/minimal-sunlit.v1.json");
  scenario.step_count = 2;
  assertError(scenario, "environment_length_mismatch");
});

test("communications/downlink invariant", () => {
  assertError("fixtures/scenarios/invalid/invalid-downlink-capacity.v1.json", "downlink_unavailable");
});

test("malformed JSON", () => {
  const text = fs.readFileSync("fixtures/scenarios/invalid/malformed-json.v1.json", "utf8");
  const result = parseScenarioJson(text);
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "invalid_json");
});

test("validator never mutates caller input", () => {
  const scenario = loadJson("fixtures/scenarios/minimal-sunlit.v1.json");
  const before = clone(scenario);
  validateResourceScenario(scenario);
  assert.deepEqual(scenario, before);
});

test("no file write, network import, or subprocess import during validation", () => {
  const before = fs.readdirSync("fixtures/scenarios").sort();
  validateResourceScenario(loadJson("fixtures/scenarios/minimal-sunlit.v1.json"));
  const after = fs.readdirSync("fixtures/scenarios").sort();
  assert.deepEqual(after, before);

  const source = fs.readFileSync("src/domain/resource-scenario.mjs", "utf8");
  assert.doesNotMatch(source, /node:(?:http|https|net|tls|dns|dgram|child_process)|\bfetch\s*\(|\bWebSocket\s*\(/);
});

