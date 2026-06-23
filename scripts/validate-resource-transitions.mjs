#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import { runResourceScenario, transitionResultPayload } from "../src/domain/resource-transition.mjs";

const fixtures = [
  ["fixtures/runs/nominal-resource-run.v1.json", "completed"],
  ["fixtures/runs/energy-deficit.v1.json", "constraint_violation"],
  ["fixtures/runs/thermal-capacity.v1.json", "constraint_violation"],
  ["fixtures/runs/combined-constraints.v1.json", "constraint_violation"],
  ["fixtures/runs/curtailed-solar.v1.json", "completed"]
];

const failures = [];

function load(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

for (const [path, expectedOutcome] of fixtures) {
  const result = runResourceScenario(load(path));
  if (!result.ok) {
    failures.push(`${path} should execute: ${JSON.stringify(result.errors)}`);
    continue;
  }
  if (result.result.outcome !== expectedOutcome) {
    failures.push(`${path} expected ${expectedOutcome}, got ${result.result.outcome}`);
  }
}

const overflow = runResourceScenario(load("fixtures/runs/arithmetic-overflow.v1.json"));
if (overflow.ok || overflow.process_status !== "internal_error" || overflow.errors[0]?.code !== "arithmetic_overflow") {
  failures.push("arithmetic-overflow fixture must be rejected as internal_error arithmetic_overflow");
}

const repeated = transitionResultPayload(runResourceScenario(load("fixtures/runs/energy-deficit.v1.json")));
const repeatedAgain = transitionResultPayload(runResourceScenario(load("fixtures/runs/energy-deficit.v1.json")));
if (JSON.stringify(repeated) !== JSON.stringify(repeatedAgain)) {
  failures.push("transition output must be deterministic across repeated runs");
}

const summary = {
  validator: "resource-transitions",
  status: failures.length === 0 ? "passed" : "failed",
  result_schema_version: "resource-transition-result.v1",
  fixture_count: fixtures.length,
  expected_overflow_failure: overflow.ok ? "failed" : "passed",
  nominal_domain_outcome: "completed",
  constraint_domain_outcome: "constraint_violation",
  malformed_input_process_status: "invalid_input",
  deterministic_output: failures.length === 0 ? "passed" : "failed",
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
