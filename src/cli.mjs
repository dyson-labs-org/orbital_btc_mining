import fs from "node:fs";
import {
  scenarioValidationPayload,
  validateScenarioDocument
} from "./domain/resource-scenario.mjs";
import {
  runScenarioDocument,
  transitionResultPayload
} from "./domain/resource-transition.mjs";
import {
  summarizeScenarioDocument,
  traceSummaryPayload
} from "./domain/resource-trace-summary.mjs";
import {
  runScenarioSuiteFile,
  suiteRunPayload
} from "./domain/scenario-suite.mjs";
import { productStatus, statusJson } from "./status.mjs";

const args = process.argv.slice(2);

function writeHelp() {
  process.stdout.write(
    [
      "Orbital Compute Lab",
      "",
      "Commands:",
      "  status                            Print deterministic operational-pilot status.",
      "  status --json                     Print the status object as JSON.",
      "  validate-scenario <path>          Validate a resource-scenario.v1 file.",
      "  validate-scenario <path> --json   Print validation as deterministic JSON.",
      "  run-scenario <path>               Run deterministic resource transitions.",
      "  run-scenario <path> --json        Print transition result as deterministic JSON.",
      "  summarize-scenario <path>         Summarize a resource-transition trace.",
      "  summarize-scenario <path> --json  Print trace summary as deterministic JSON.",
      "  run-suite <path>                  Run a deterministic scenario-suite.v1 file.",
      "  run-suite <path> --json           Print suite result as deterministic JSON.",
      "  help                              Print this help.",
      "",
      "No simulation kernel, workload scheduler, Bitcoin workload, AI workload, wallet,",
      "trading, external network, hardware, or mission-authority behavior is implemented."
    ].join("\n") + "\n"
  );
}

function writeStatusText() {
  process.stdout.write(`${productStatus.product_name}\n`);
  process.stdout.write(`status: ${productStatus.implementation_status}\n`);
  process.stdout.write(`maturity: ${productStatus.maturity}\n`);
  process.stdout.write("simulation: not implemented\n");
  process.stdout.write("resource scenario contract: implemented\n");
  process.stdout.write("resource scenario validation: implemented\n");
  process.stdout.write("deterministic resource transition: implemented\n");
  process.stdout.write("scenario suite contract: implemented\n");
  process.stdout.write("scenario suite runner: implemented\n");
  process.stdout.write("resource trace summary: implemented\n");
  process.stdout.write("scheduler: not implemented\n");
  process.stdout.write("bitcoin behavior: not implemented\n");
  process.stdout.write("ai behavior: not implemented\n");
  process.stdout.write("external network: none\n");
}

function readScenario(path) {
  try {
    return { ok: true, text: fs.readFileSync(path, "utf8"), errors: [] };
  } catch {
    return {
      ok: false,
      errors: [
        {
          code: "scenario_file_not_found",
          path: "$",
          message: "Scenario file could not be read."
        }
      ]
    };
  }
}

function writeValidationJson(result) {
  process.stdout.write(`${JSON.stringify(scenarioValidationPayload(result), null, 2)}\n`);
}

function writeTransitionJson(result) {
  process.stdout.write(`${JSON.stringify(transitionResultPayload(result), null, 2)}\n`);
}

function writeTraceSummaryJson(result) {
  process.stdout.write(`${JSON.stringify(traceSummaryPayload(result), null, 2)}\n`);
}

function writeTraceSummaryText(summary) {
  process.stdout.write(`resource trace summary: ${summary.scenario_id}\n`);
  process.stdout.write(`outcome: ${summary.outcome}\n`);
  process.stdout.write(`processed steps: ${summary.processed_steps}\n`);
  process.stdout.write(`total duration ms: ${summary.total_duration_ms}\n`);
  process.stdout.write(`solar input millijoules: ${summary.totals.solar_input_millijoules}\n`);
  process.stdout.write(`curtailed solar millijoules: ${summary.totals.curtailed_solar_millijoules}\n`);
  process.stdout.write(`base load millijoules: ${summary.totals.base_load_millijoules}\n`);
  process.stdout.write(`energy shortfall millijoules: ${summary.totals.energy_shortfall_millijoules}\n`);
  process.stdout.write(`thermal input millijoules: ${summary.totals.thermal_input_millijoules}\n`);
  process.stdout.write(`thermal dissipation millijoules: ${summary.totals.thermal_dissipation_millijoules}\n`);
  process.stdout.write(`thermal excess millijoules: ${summary.totals.thermal_excess_millijoules}\n`);
  process.stdout.write(`downlink capacity bytes: ${summary.totals.downlink_capacity_bytes}\n`);
  process.stdout.write(`communications available steps: ${summary.totals.communications_available_steps}\n`);
  process.stdout.write(`communications unavailable steps: ${summary.totals.communications_unavailable_steps}\n`);
  if (summary.constraint_summary.length === 0) {
    process.stdout.write("constraints: none\n");
  } else {
    process.stdout.write("constraints:\n");
    for (const item of summary.constraint_summary) {
      process.stdout.write(`  ${item.code}: count=${item.count} total_amount_millijoules=${item.total_amount_millijoules}\n`);
    }
  }
}

function writeSuiteJson(result) {
  process.stdout.write(`${JSON.stringify(suiteRunPayload(result), null, 2)}\n`);
}

function writeErrors(errors) {
  for (const item of errors) {
    const prefix = item.case_id ? `${item.case_id} ` : "";
    process.stderr.write(`${prefix}${item.code} ${item.path}: ${item.message}\n`);
  }
}

function validateScenario(argv) {
  const [scenarioPath, option, extra] = argv;
  if (!scenarioPath) {
    process.stderr.write("Missing scenario path. Use `validate-scenario <path>` or `validate-scenario <path> --json`.\n");
    return 2;
  }
  if (extra || (option && option !== "--json")) {
    process.stderr.write("Unknown validate-scenario option. Use `validate-scenario <path>` or `validate-scenario <path> --json`.\n");
    return 2;
  }

  const json = option === "--json";
  const read = readScenario(scenarioPath);
  if (!read.ok) {
    const result = { ok: false, scenario: null, errors: read.errors };
    if (json) {
      writeValidationJson(result);
    } else {
      writeErrors(result.errors);
    }
    return 1;
  }

  const result = validateScenarioDocument(read.text);
  if (json) {
    writeValidationJson(result);
    return result.ok ? 0 : 1;
  }
  if (!result.ok) {
    writeErrors(result.errors);
    return 1;
  }
  process.stdout.write(`valid resource scenario: ${result.scenario.scenario_id}\n`);
  return 0;
}

function runScenario(argv) {
  const [scenarioPath, option, extra] = argv;
  if (!scenarioPath) {
    process.stderr.write("Missing scenario path. Use `run-scenario <path>` or `run-scenario <path> --json`.\n");
    return 2;
  }
  if (extra || (option && option !== "--json")) {
    process.stderr.write("Unknown run-scenario option. Use `run-scenario <path>` or `run-scenario <path> --json`.\n");
    return 2;
  }

  const json = option === "--json";
  const read = readScenario(scenarioPath);
  if (!read.ok) {
    const result = { ok: false, process_status: "invalid_input", result: null, errors: read.errors };
    if (json) {
      writeTransitionJson(result);
    } else {
      writeErrors(result.errors);
    }
    return 1;
  }

  const result = runScenarioDocument(read.text);
  if (json) {
    writeTransitionJson(result);
  } else if (!result.ok) {
    writeErrors(result.errors);
  } else {
    process.stdout.write(`${result.result.outcome} resource scenario: ${result.result.scenario_id}\n`);
  }

  if (result.ok) {
    return 0;
  }
  return result.process_status === "internal_error" ? 3 : 1;
}

function summarizeScenario(argv) {
  const [scenarioPath, option, extra] = argv;
  if (!scenarioPath) {
    process.stderr.write("Missing scenario path. Use `summarize-scenario <path>` or `summarize-scenario <path> --json`.\n");
    return 2;
  }
  if (extra || (option && option !== "--json")) {
    process.stderr.write("Unknown summarize-scenario option. Use `summarize-scenario <path>` or `summarize-scenario <path> --json`.\n");
    return 2;
  }

  const json = option === "--json";
  const read = readScenario(scenarioPath);
  if (!read.ok) {
    const result = { ok: false, process_status: "invalid_input", summary: null, errors: read.errors };
    if (json) {
      writeTraceSummaryJson(result);
    } else {
      writeErrors(result.errors);
    }
    return 1;
  }

  const result = summarizeScenarioDocument(read.text);
  if (json) {
    writeTraceSummaryJson(result);
  } else if (!result.ok) {
    writeErrors(result.errors);
  } else {
    writeTraceSummaryText(result.summary);
  }

  if (result.ok) {
    return 0;
  }
  return result.process_status === "internal_error" ? 3 : 1;
}

function runSuite(argv) {
  const [suitePath, option, extra] = argv;
  if (!suitePath) {
    process.stderr.write("Missing suite path. Use `run-suite <path>` or `run-suite <path> --json`.\n");
    return 2;
  }
  if (extra || (option && option !== "--json")) {
    process.stderr.write("Unknown run-suite option. Use `run-suite <path>` or `run-suite <path> --json`.\n");
    return 2;
  }

  const json = option === "--json";
  const result = runScenarioSuiteFile(suitePath);
  if (json) {
    writeSuiteJson(result);
  } else if (!result.ok) {
    writeErrors(result.errors);
  } else if (result.outcome !== "passed") {
    for (const item of result.cases.filter((caseResult) => !caseResult.matched)) {
      process.stderr.write(`${item.case_id}: ${item.failure_codes.join(",")}\n`);
    }
  } else {
    process.stdout.write(`passed scenario suite: ${result.suite_id}\n`);
  }

  if (result.ok && result.outcome === "passed") {
    return 0;
  }
  return result.process_status === "internal_error" ? 3 : 1;
}

function main(argv) {
  const [command, option, extra] = argv;

  if (!command || command === "help") {
    writeHelp();
    return 0;
  }

  if (command === "status") {
    if (extra || (option && option !== "--json")) {
      process.stderr.write("Unknown status option. Use `status` or `status --json`.\n");
      return 2;
    }
    if (option === "--json") {
      process.stdout.write(statusJson());
      return 0;
    }
    writeStatusText();
    return 0;
  }

  if (command === "validate-scenario") {
    return validateScenario(argv.slice(1));
  }

  if (command === "run-scenario") {
    return runScenario(argv.slice(1));
  }

  if (command === "summarize-scenario") {
    return summarizeScenario(argv.slice(1));
  }

  if (command === "run-suite") {
    return runSuite(argv.slice(1));
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.stderr.write("Run `node src/cli.mjs help` for usage.\n");
  return 2;
}

process.exitCode = main(args);
