import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("package metadata is private dependency-free pilot metadata", () => {
  assert.equal(packageJson.name, "orbital-compute-lab");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.version, "0.0.0");
  assert.equal(packageJson.type, "module");
  assert.deepEqual(packageJson.dependencies ?? {}, {});
  assert.deepEqual(packageJson.devDependencies ?? {}, {});
  assert.equal(packageJson.workspaces, undefined);
});

test("package scripts contain no install or lifecycle effects", () => {
  const scripts = packageJson.scripts ?? {};
  assert.equal(scripts["validate:pilot"], "node scripts/validate-operational-pilot.mjs");
  assert.equal(scripts["validate:active-tree"], "node scripts/validate-active-tree-boundaries.mjs");
  assert.equal(scripts["validate:status"], "node scripts/validate-operational-status.mjs");
  assert.equal(scripts["validate:trace-summary"], "node scripts/validate-resource-trace-summaries.mjs");
  assert.equal(scripts.verify, "node scripts/validate-active-tree-boundaries.mjs");
  assert.equal(scripts["validate:charter"], undefined);
  assert.equal(scripts["validate:skeleton"], undefined);
  for (const lifecycle of ["preinstall", "install", "postinstall", "prepare", "prepublish", "prepack", "postpack"]) {
    assert.equal(scripts[lifecycle], undefined);
  }
  for (const value of Object.values(scripts)) {
    assert.doesNotMatch(value, /\bnpm\b|\bpnpm\b|\bnpx\b|curl|wget|Invoke-WebRequest|Invoke-RestMethod/);
  }
});
