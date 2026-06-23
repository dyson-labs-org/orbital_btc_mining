import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  runResourceScenario,
  runScenarioDocument,
  transitionResultPayload
} from "../../src/domain/resource-transition.mjs";

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function run(path) {
  return runResourceScenario(loadJson(path));
}

test("nominal completed outcome", () => {
  const result = run("fixtures/runs/nominal-resource-run.v1.json");
  assert.equal(result.ok, true);
  assert.equal(result.result.outcome, "completed");
  assert.equal(result.result.processed_steps, 2);
  assert.deepEqual(result.result.final_state, {
    battery_energy_millijoules: 750,
    battery_capacity_millijoules: 1000,
    thermal_load_millijoules: 120,
    thermal_capacity_millijoules: 500
  });
  assert.deepEqual(result.result.constraint_violations, []);
});

test("solar curtailment is recorded", () => {
  const result = run("fixtures/runs/curtailed-solar.v1.json");
  const step = result.result.step_results[0];
  assert.equal(result.result.outcome, "completed");
  assert.equal(step.curtailed_solar_millijoules, 100);
  assert.equal(step.battery_energy_after_millijoules, 950);
});

test("energy deficit is a domain constraint violation", () => {
  const result = run("fixtures/runs/energy-deficit.v1.json");
  assert.equal(result.ok, true);
  assert.equal(result.result.outcome, "constraint_violation");
  assert.equal(result.result.step_results[0].energy_shortfall_millijoules, 30);
  assert.deepEqual(result.result.constraint_violations, [
    { code: "ENERGY_DEFICIT", step: 0, amount_millijoules: 30 }
  ]);
});

test("thermal capacity violation is recorded", () => {
  const result = run("fixtures/runs/thermal-capacity.v1.json");
  assert.equal(result.result.outcome, "constraint_violation");
  assert.equal(result.result.step_results[0].thermal_excess_millijoules, 10);
  assert.deepEqual(result.result.constraint_violations, [
    { code: "THERMAL_CAPACITY_EXCEEDED", step: 0, amount_millijoules: 10 }
  ]);
});

test("combined violations keep stable energy then thermal ordering", () => {
  const result = run("fixtures/runs/combined-constraints.v1.json");
  assert.equal(result.result.outcome, "constraint_violation");
  assert.deepEqual(result.result.step_results[0].constraint_violations.map((item) => item.code), [
    "ENERGY_DEFICIT",
    "THERMAL_CAPACITY_EXCEEDED"
  ]);
  assert.deepEqual(result.result.constraint_violations.map((item) => item.code), [
    "ENERGY_DEFICIT",
    "THERMAL_CAPACITY_EXCEEDED"
  ]);
});

test("multiple-step state progression is deterministic", () => {
  const result = run("fixtures/runs/nominal-resource-run.v1.json");
  assert.equal(result.result.step_results[0].battery_energy_before_millijoules, 500);
  assert.equal(result.result.step_results[0].battery_energy_after_millijoules, 600);
  assert.equal(result.result.step_results[1].battery_energy_before_millijoules, 600);
  assert.equal(result.result.step_results[1].battery_energy_after_millijoules, 750);
});

test("communications are passed through without data-transfer behavior", () => {
  const result = run("fixtures/runs/nominal-resource-run.v1.json");
  assert.equal(result.result.step_results[1].communications_available, true);
  assert.equal(result.result.step_results[1].downlink_capacity_bytes, 1024);
  assert.equal(Object.hasOwn(result.result.step_results[1], "data_transferred_bytes"), false);
  assert.equal(Object.hasOwn(result.result.final_state, "data_queue_bytes"), false);
});

test("safe-integer overflow is rejected", () => {
  const result = run("fixtures/runs/arithmetic-overflow.v1.json");
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "arithmetic_overflow");
});

test("caller input is never mutated", () => {
  const scenario = loadJson("fixtures/runs/energy-deficit.v1.json");
  const before = clone(scenario);
  runResourceScenario(scenario);
  assert.deepEqual(scenario, before);
});

test("repeated deterministic output", () => {
  const scenario = loadJson("fixtures/runs/combined-constraints.v1.json");
  const first = transitionResultPayload(runResourceScenario(scenario));
  const second = transitionResultPayload(runResourceScenario(scenario));
  const third = transitionResultPayload(runResourceScenario(scenario));
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test("malformed JSON stays distinct from domain outcome", () => {
  const result = runScenarioDocument("{ malformed");
  assert.equal(result.ok, false);
  assert.equal(result.process_status, "invalid_input");
  assert.equal(result.errors[0].code, "invalid_json");
});

test("no file write, network import, or subprocess import during transition", () => {
  const before = fs.readdirSync("fixtures/runs").sort();
  run("fixtures/runs/nominal-resource-run.v1.json");
  const after = fs.readdirSync("fixtures/runs").sort();
  assert.deepEqual(after, before);

  const source = fs.readFileSync("src/domain/resource-transition.mjs", "utf8");
  assert.doesNotMatch(source, /node:(?:fs|http|https|net|tls|dns|dgram|child_process)|\bfetch\s*\(|\bWebSocket\s*\(/);
});
