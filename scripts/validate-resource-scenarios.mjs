#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import {
  validateResourceScenario,
  validateScenarioDocument
} from "../src/domain/resource-scenario.mjs";

const validFixtures = [
  "fixtures/scenarios/minimal-sunlit.v1.json",
  "fixtures/scenarios/eclipse-transition.v1.json",
  "fixtures/scenarios/communications-window.v1.json"
];

const invalidFixtures = new Map([
  ["fixtures/scenarios/invalid/negative-energy.v1.json", "negative_integer"],
  ["fixtures/scenarios/invalid/battery-over-capacity.v1.json", "battery_over_capacity"],
  ["fixtures/scenarios/invalid/noncontiguous-steps.v1.json", "step_index_mismatch"],
  ["fixtures/scenarios/invalid/float-value.v1.json", "invalid_integer"],
  ["fixtures/scenarios/invalid/unknown-field.v1.json", "unknown_field"],
  ["fixtures/scenarios/invalid/invalid-downlink-capacity.v1.json", "downlink_unavailable"],
  ["fixtures/scenarios/invalid/unsafe-integer.v1.json", "invalid_integer"],
  ["fixtures/scenarios/invalid/malformed-json.v1.json", "invalid_json"]
]);

const failures = [];

function read(path) {
  return fs.readFileSync(path, "utf8");
}

for (const fixture of validFixtures) {
  const result = validateScenarioDocument(read(fixture));
  if (!result.ok) {
    failures.push(`${fixture} should be valid: ${JSON.stringify(result.errors)}`);
  }
}

for (const [fixture, code] of invalidFixtures) {
  const result = validateScenarioDocument(read(fixture));
  if (result.ok) {
    failures.push(`${fixture} should be invalid`);
    continue;
  }
  if (!result.errors.some((item) => item.code === code)) {
    failures.push(`${fixture} missing expected error code ${code}`);
  }
}

const repeated = validateResourceScenario(JSON.parse(read(validFixtures[0])));
if (JSON.stringify(repeated) !== JSON.stringify(validateResourceScenario(JSON.parse(read(validFixtures[0]))))) {
  failures.push("validation output must be deterministic across repeated runs");
}

const summary = {
  validator: "resource-scenarios",
  status: failures.length === 0 ? "passed" : "failed",
  schema_version: "resource-scenario.v1",
  valid_fixture_count: validFixtures.length,
  expected_negative_fixture_count: invalidFixtures.size,
  expected_negative_tests: failures.length === 0 ? "passed" : "failed",
  simulation_kernel: "not_implemented",
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
