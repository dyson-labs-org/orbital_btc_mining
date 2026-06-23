import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

test("package metadata is private dependency-free skeleton metadata", () => {
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
  for (const lifecycle of ["preinstall", "install", "postinstall", "prepare", "prepublish", "prepack", "postpack"]) {
    assert.equal(scripts[lifecycle], undefined);
  }
  for (const value of Object.values(scripts)) {
    assert.doesNotMatch(value, /\bnpm\b|\bpnpm\b|\bnpx\b|curl|wget|Invoke-WebRequest|Invoke-RestMethod/);
  }
});
