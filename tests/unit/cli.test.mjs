import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

test("status --json emits only deterministic status JSON", () => {
  const first = execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], {
    encoding: "utf8"
  });
  const second = execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], {
    encoding: "utf8"
  });
  assert.equal(first, second);
  const parsed = JSON.parse(first);
  assert.equal(parsed.schema_version, "operational-status.v1");
  assert.equal(parsed.product_name, "Orbital Compute Lab");
  assert.equal(parsed.maturity, "operational_pilot");
  assert.equal(parsed.implementation_status, "controlled_test_range");
  assert.equal(parsed.capabilities.resource_scenario_contract, true);
  assert.equal(parsed.capabilities.resource_scenario_validation, true);
  assert.equal(parsed.capabilities.deterministic_resource_transition, true);
  assert.equal(parsed.capabilities.scenario_suite_contract, true);
  assert.equal(parsed.capabilities.scenario_suite_runner, true);
  assert.equal(parsed.capabilities.resource_trace_summary, false);
  assert.equal(parsed.capabilities.simulation_kernel, false);
  assert.equal(parsed.capabilities.workload_scheduler, false);
});

test("status text and help do not overstate implementation", () => {
  const status = execFileSync(process.execPath, ["src/cli.mjs", "status"], {
    encoding: "utf8"
  });
  assert.match(status, /status: controlled_test_range/);
  assert.match(status, /maturity: operational_pilot/);
  assert.match(status, /simulation: not implemented/);
  assert.match(status, /resource scenario contract: implemented/);
  assert.match(status, /deterministic resource transition: implemented/);
  assert.match(status, /scenario suite runner: implemented/);
  assert.match(status, /scheduler: not implemented/);
  assert.match(status, /bitcoin behavior: not implemented/);
  assert.match(status, /ai behavior: not implemented/);

  const help = execFileSync(process.execPath, ["src/cli.mjs", "help"], {
    encoding: "utf8"
  });
  assert.match(help, /operational-pilot status/);
  assert.match(help, /No simulation kernel/);
});

test("unknown commands fail nonzero and write diagnostics to stderr", () => {
  const result = spawnSync(process.execPath, ["src/cli.mjs", "simulate"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown command: simulate/);
});