import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  RESOURCE_TRACE_SUMMARY_SCHEMA_VERSION,
  summarizeResourceScenario,
  summarizeScenarioDocument,
  summarizeTransitionResult,
  traceSummaryPayload
} from "../../src/index.mjs";

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function summarize(path) {
  return summarizeResourceScenario(loadJson(path));
}

function expected(path) {
  return loadJson(path);
}

test("nominal trace summary matches exact fixture", () => {
  const result = summarize("fixtures/runs/nominal-resource-run.v1.json");
  assert.equal(result.ok, true);
  assert.deepEqual(result.summary, expected("fixtures/summaries/nominal-resource-run-summary.v1.json"));
  assert.equal(result.summary.schema_version, RESOURCE_TRACE_SUMMARY_SCHEMA_VERSION);
});

test("constraint trace summary matches exact fixture", () => {
  const result = summarize("fixtures/runs/energy-deficit.v1.json");
  assert.equal(result.ok, true);
  assert.deepEqual(result.summary, expected("fixtures/summaries/energy-deficit-summary.v1.json"));
  assert.deepEqual(result.summary.constraint_summary, [
    { code: "ENERGY_DEFICIT", count: 1, total_amount_millijoules: 30 }
  ]);
});

test("combined constraint summary preserves first-observed constraint order", () => {
  const result = summarize("fixtures/runs/combined-constraints.v1.json");
  assert.equal(result.ok, true);
  assert.deepEqual(result.summary, expected("fixtures/summaries/combined-constraints-summary.v1.json"));
  assert.deepEqual(result.summary.constraint_summary.map((item) => item.code), [
    "ENERGY_DEFICIT",
    "THERMAL_CAPACITY_EXCEEDED"
  ]);
});

test("summary derives duration from validated scenario step duration", () => {
  const scenario = loadJson("fixtures/runs/nominal-resource-run.v1.json");
  scenario.step_duration_ms = 2500;
  const result = summarizeResourceScenario(scenario);
  assert.equal(result.ok, true);
  assert.equal(result.summary.processed_steps, 2);
  assert.equal(result.summary.total_duration_ms, 5000);
});

test("summary payload is deterministic", () => {
  const scenario = loadJson("fixtures/runs/combined-constraints.v1.json");
  const first = traceSummaryPayload(summarizeResourceScenario(scenario));
  const second = traceSummaryPayload(summarizeResourceScenario(scenario));
  const third = traceSummaryPayload(summarizeResourceScenario(scenario));
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test("invalid JSON and invalid scenarios fail without a summary", () => {
  const malformed = summarizeScenarioDocument("{ malformed");
  assert.equal(malformed.ok, false);
  assert.equal(malformed.process_status, "invalid_input");
  assert.equal(malformed.summary, null);
  assert.equal(malformed.errors[0].code, "invalid_json");

  const invalid = summarizeScenarioDocument(fs.readFileSync("fixtures/scenarios/invalid/negative-energy.v1.json", "utf8"));
  assert.equal(invalid.ok, false);
  assert.equal(invalid.process_status, "invalid_input");
  assert.equal(invalid.summary, null);
  assert.ok(invalid.errors.some((item) => item.code === "negative_integer"));
});

test("summary aggregation overflow is rejected", () => {
  const result = summarizeTransitionResult({
    schema_version: "resource-transition-result.v1",
    scenario_id: "overflow-summary",
    outcome: "completed",
    processed_steps: 2,
    final_state: {
      battery_energy_millijoules: 0,
      battery_capacity_millijoules: 0,
      thermal_load_millijoules: 0,
      thermal_capacity_millijoules: 0
    },
    step_results: [
      {
        step: 0,
        solar_input_millijoules: Number.MAX_SAFE_INTEGER,
        curtailed_solar_millijoules: 0,
        base_load_millijoules: 0,
        energy_shortfall_millijoules: 0,
        thermal_input_millijoules: 0,
        thermal_dissipation_millijoules: 0,
        thermal_excess_millijoules: 0,
        downlink_capacity_bytes: 0,
        communications_available: false,
        constraint_violations: []
      },
      {
        step: 1,
        solar_input_millijoules: 1,
        curtailed_solar_millijoules: 0,
        base_load_millijoules: 0,
        energy_shortfall_millijoules: 0,
        thermal_input_millijoules: 0,
        thermal_dissipation_millijoules: 0,
        thermal_excess_millijoules: 0,
        downlink_capacity_bytes: 0,
        communications_available: true,
        constraint_violations: []
      }
    ],
    constraint_violations: []
  }, { stepDurationMs: 1 });
  assert.equal(result.ok, false);
  assert.equal(result.process_status, "internal_error");
  assert.equal(result.errors[0].code, "arithmetic_overflow");
});

test("summary duration overflow is rejected", () => {
  const transition = summarize("fixtures/runs/nominal-resource-run.v1.json").summary;
  const result = summarizeTransitionResult({
    schema_version: "resource-transition-result.v1",
    scenario_id: transition.scenario_id,
    outcome: transition.outcome,
    processed_steps: transition.processed_steps,
    final_state: transition.final_state,
    step_results: [
      {
        step: 0,
        solar_input_millijoules: 0,
        curtailed_solar_millijoules: 0,
        base_load_millijoules: 0,
        energy_shortfall_millijoules: 0,
        thermal_input_millijoules: 0,
        thermal_dissipation_millijoules: 0,
        thermal_excess_millijoules: 0,
        downlink_capacity_bytes: 0,
        communications_available: false,
        constraint_violations: []
      },
      {
        step: 1,
        solar_input_millijoules: 0,
        curtailed_solar_millijoules: 0,
        base_load_millijoules: 0,
        energy_shortfall_millijoules: 0,
        thermal_input_millijoules: 0,
        thermal_dissipation_millijoules: 0,
        thermal_excess_millijoules: 0,
        downlink_capacity_bytes: 0,
        communications_available: true,
        constraint_violations: []
      }
    ],
    constraint_violations: []
  }, { stepDurationMs: Number.MAX_SAFE_INTEGER });
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "arithmetic_overflow");
});

test("caller input is never mutated", () => {
  const scenario = loadJson("fixtures/runs/energy-deficit.v1.json");
  const before = clone(scenario);
  summarizeResourceScenario(scenario);
  assert.deepEqual(scenario, before);
});

test("summary module does not import IO, network, or subprocess APIs", () => {
  const source = fs.readFileSync("src/domain/resource-trace-summary.mjs", "utf8");
  assert.doesNotMatch(source, /node:(?:fs|http|https|net|tls|dns|dgram|child_process)|\bfetch\s*\(|\bWebSocket\s*\(/);
  assert.doesNotMatch(source, /environment_steps/);
});
