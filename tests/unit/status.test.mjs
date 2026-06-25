import assert from "node:assert/strict";
import test from "node:test";
import { getStatus, statusJson } from "../../src/index.mjs";

test("status metadata is deterministic and honest", () => {
  const status = getStatus();
  assert.equal(status.schema_version, "1.0");
  assert.equal(status.product_name, "Orbital Compute Lab");
  assert.equal(status.repository, "dyson-labs-org/orbital_btc_mining");
  assert.equal(status.maturity, "operational_pilot");
  assert.equal(status.implementation_status, "controlled_test_range");
  assert.equal(status.version, "0.0.0");
  assert.equal(status.runtime.name, "node");
  assert.equal(status.runtime.minimum_version, "22");
  assert.equal(statusJson(), statusJson());
});

test("only resource and scenario-suite capabilities are true", () => {
  const capabilities = getStatus().capabilities;
  for (const [name, value] of Object.entries(capabilities)) {
    const expected = [
      "resource_scenario_contract",
      "resource_scenario_validation",
      "deterministic_resource_transition",
      "scenario_suite_contract",
      "scenario_suite_runner"
    ].includes(name);
    assert.equal(value, expected, `${name} capability mismatch`);
  }
});