import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const validPath = "fixtures/scenarios/minimal-sunlit.v1.json";
const invalidPath = "fixtures/scenarios/invalid/negative-energy.v1.json";
const malformedPath = "fixtures/scenarios/invalid/malformed-json.v1.json";

function run(args) {
  return spawnSync(process.execPath, ["src/cli.mjs", ...args], {
    encoding: "utf8"
  });
}

test("CLI human-readable success", () => {
  const result = run(["validate-scenario", validPath]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /valid resource scenario/);
  assert.equal(result.stderr, "");
});

test("CLI JSON success", () => {
  const result = run(["validate-scenario", validPath, "--json"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.scenario_id, "minimal-sunlit");
  assert.deepEqual(payload.errors, []);
});

test("CLI deterministic JSON output", () => {
  const first = run(["validate-scenario", validPath, "--json"]);
  const second = run(["validate-scenario", validPath, "--json"]);
  const third = run(["validate-scenario", validPath, "--json"]);
  assert.equal(first.stdout, second.stdout);
  assert.equal(second.stdout, third.stdout);
});

test("CLI unknown option", () => {
  const result = run(["validate-scenario", validPath, "--yaml"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown validate-scenario option/);
});

test("CLI invalid scenario exit code", () => {
  const result = run(["validate-scenario", invalidPath]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /negative_integer/);
});

test("CLI invalid scenario JSON output", () => {
  const result = run(["validate-scenario", invalidPath, "--json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.errors.some((error) => error.code === "negative_integer"));
});

test("CLI missing file", () => {
  const result = run(["validate-scenario", "fixtures/scenarios/missing.v1.json"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /scenario_file_not_found/);
  assert.doesNotMatch(result.stderr, /Error:/);
});

test("CLI malformed JSON", () => {
  const result = run(["validate-scenario", malformedPath]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /invalid_json/);
  assert.doesNotMatch(result.stderr, /SyntaxError/);
});

test("CLI validation writes no files", () => {
  const before = fs.readdirSync("fixtures/scenarios").sort();
  const result = run(["validate-scenario", validPath, "--json"]);
  assert.equal(result.status, 0);
  const after = fs.readdirSync("fixtures/scenarios").sort();
  assert.deepEqual(after, before);
});

