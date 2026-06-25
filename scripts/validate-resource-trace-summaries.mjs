#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import {
  summarizeResourceScenario,
  summarizeScenarioDocument,
  summarizeTransitionResult,
  traceSummaryPayload
} from "../src/domain/resource-trace-summary.mjs";

const summaryFixtures = [
  ["fixtures/runs/nominal-resource-run.v1.json", "fixtures/summaries/nominal-resource-run-summary.v1.json"],
  ["fixtures/runs/energy-deficit.v1.json", "fixtures/summaries/energy-deficit-summary.v1.json"],
  ["fixtures/runs/combined-constraints.v1.json", "fixtures/summaries/combined-constraints-summary.v1.json"]
];

const op1OutputHashes = {
  nominal_resource_run_json: "da9328d1d0514da0475347bae7612e49f98e0fb12f309b1145e9f242cdfa64ac",
  energy_deficit_run_json: "f6fba555d89809f131e3fb9393344cf6c721924592fd848195caf3905c5a443c",
  core_resource_regression_json: "6397712169cead2b6dd081e92eb59830e100ef2c0dc5ce065425492171d2ac23",
  expectation_mismatch_json: "791a47444a137dd0fa6dab131d37ee8823bf918dc049898a23fde890481c66f5"
};

const failures = [];

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function runCli(args) {
  return execFileSync(process.execPath, ["src/cli.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" }
  });
}

for (const [scenarioPath, expectedPath] of summaryFixtures) {
  const scenario = loadJson(scenarioPath);
  const expected = loadJson(expectedPath);
  const result = summarizeResourceScenario(scenario);
  if (!result.ok) {
    failures.push(`${scenarioPath} summary failed: ${JSON.stringify(result.errors)}`);
    continue;
  }
  if (stableJson(result.summary) !== stableJson(expected)) {
    failures.push(`${scenarioPath} summary did not match ${expectedPath}`);
  }
}

const malformed = summarizeScenarioDocument("{ malformed");
if (malformed.ok || malformed.process_status !== "invalid_input" || malformed.errors[0]?.code !== "invalid_json") {
  failures.push("malformed summary input must fail as invalid_input invalid_json");
}

const overflow = summarizeTransitionResult({
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
if (overflow.ok || overflow.process_status !== "internal_error" || overflow.errors[0]?.code !== "arithmetic_overflow") {
  failures.push("summary aggregation overflow must fail as internal_error arithmetic_overflow");
}

const nominalJson = runCli(["summarize-scenario", "fixtures/runs/nominal-resource-run.v1.json", "--json"]);
const nominalJsonAgain = runCli(["summarize-scenario", "fixtures/runs/nominal-resource-run.v1.json", "--json"]);
if (nominalJson !== nominalJsonAgain) {
  failures.push("summary JSON CLI output must be byte-identical across repeated runs");
}
const parsedNominal = JSON.parse(nominalJson);
if (parsedNominal.schema_version !== "resource-trace-summary-run.v1" || parsedNominal.summary?.schema_version !== "resource-trace-summary.v1") {
  failures.push("summary JSON CLI schema versions are incorrect");
}

const textOne = runCli(["summarize-scenario", "fixtures/runs/energy-deficit.v1.json"]);
const textTwo = runCli(["summarize-scenario", "fixtures/runs/energy-deficit.v1.json"]);
if (textOne !== textTwo || !textOne.includes("resource trace summary: energy-deficit") || !textOne.includes("ENERGY_DEFICIT: count=1 total_amount_millijoules=30")) {
  failures.push("summary text CLI output must be deterministic and include constraint totals");
}

const hashChecks = {
  nominal_resource_run_json: sha256(runCli(["run-scenario", "fixtures/runs/nominal-resource-run.v1.json", "--json"])),
  energy_deficit_run_json: sha256(runCli(["run-scenario", "fixtures/runs/energy-deficit.v1.json", "--json"])),
  core_resource_regression_json: sha256(runCli(["run-suite", "fixtures/suites/core-resource-regression.v1.json", "--json"])),
  expectation_mismatch_json: null
};
try {
  runCli(["run-suite", "fixtures/suites/invalid/expectation-mismatch.v1.json", "--json"]);
  failures.push("expectation mismatch suite unexpectedly exited 0");
} catch (error) {
  hashChecks.expectation_mismatch_json = sha256(error.stdout ?? "");
}

for (const [name, expected] of Object.entries(op1OutputHashes)) {
  if (hashChecks[name] !== expected) {
    failures.push(`${name} changed from OP-1 baseline: expected ${expected}, got ${hashChecks[name]}`);
  }
}

const status = JSON.parse(runCli(["status", "--json"]));
if (status.capabilities?.resource_trace_summary !== true) {
  failures.push("resource_trace_summary capability must be true after OP-2 implementation");
}
for (const capability of ["simulation_kernel", "workload_scheduler", "bitcoin_workload_model", "ai_workload_model", "telemetry", "external_network", "wallet", "hardware_control", "mission_authority"]) {
  if (status.capabilities?.[capability] !== false) {
    failures.push(`${capability} capability must remain false`);
  }
}

const summary = {
  validator: "resource-trace-summaries",
  status: failures.length === 0 ? "passed" : "failed",
  summary_schema_version: "resource-trace-summary.v1",
  fixture_count: summaryFixtures.length,
  deterministic_json_cli: nominalJson === nominalJsonAgain ? "passed" : "failed",
  deterministic_text_cli: textOne === textTwo ? "passed" : "failed",
  invalid_input_process_status: "invalid_input",
  aggregation_overflow_failure: overflow.ok ? "failed" : "passed",
  existing_scenario_output_hashes: {
    nominal_resource_run_json: hashChecks.nominal_resource_run_json,
    energy_deficit_run_json: hashChecks.energy_deficit_run_json
  },
  existing_suite_output_hashes: {
    core_resource_regression_json: hashChecks.core_resource_regression_json,
    expectation_mismatch_json: hashChecks.expectation_mismatch_json
  },
  resource_trace_summary_capability: status.capabilities?.resource_trace_summary === true ? "passed" : "failed",
  transition_semantics: failures.some((item) => item.includes("changed from OP-1 baseline")) ? "failed" : "unchanged",
  scheduler: "not_implemented",
  bitcoin_workload: "not_implemented",
  ai_workload: "not_implemented",
  telemetry: "not_implemented",
  external_service_calls: "none",
  failures
};

process.stdout.write(stableJson(summary));
if (failures.length > 0) {
  process.exit(1);
}
