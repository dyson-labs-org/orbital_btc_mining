import assert from "node:assert/strict";
import test from "node:test";
import { getStatus, statusJson } from "../../src/index.mjs";

test("status metadata is deterministic and honest", () => {
  const status = getStatus();
  assert.equal(status.schema_version, "1.0");
  assert.equal(status.product_name, "Orbital Compute Lab");
  assert.equal(status.repository, "dyson-labs-org/orbital_btc_mining");
  assert.equal(status.maturity, "incubation");
  assert.equal(status.implementation_status, "skeleton");
  assert.equal(status.version, "0.0.0");
  assert.equal(status.runtime.name, "node");
  assert.equal(status.runtime.minimum_version, "22");
  assert.equal(statusJson(), statusJson());
});

test("all product capabilities remain false in I0.5", () => {
  const capabilities = getStatus().capabilities;
  for (const [name, value] of Object.entries(capabilities)) {
    assert.equal(value, false, `${name} must be false in the skeleton`);
  }
});
