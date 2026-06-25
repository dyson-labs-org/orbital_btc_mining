import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const baselineSha = "c93c7366edcd86b83896c3c39b753805183c3126";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("operational pilot validator passes", () => {
  const output = execFileSync(process.execPath, ["scripts/validate-operational-pilot.mjs"], {
    encoding: "utf8"
  });
  const summary = JSON.parse(output);
  assert.equal(summary.status, "passed");
  assert.equal(summary.pilot_status, "operational_pilot");
  assert.equal(summary.active_tree_status, "controlled_test_range");
  assert.equal(summary.legacy_source, "not_run");
  assert.equal(summary.external_calls, "none");
  assert.equal(summary.project_json, "not_created");
});

test("project-json remains absent and active docs do not require it", () => {
  assert.equal(fs.existsSync(".agent-harness/project.json"), false);
  const docs = [
    read("README.md"),
    read("AGENTS.md"),
    read(".agent-harness/README.md"),
    read("docs/operational-pilot.md")
  ].join("\n");
  assert.match(docs, /No consumed schema exists/);
  assert.doesNotMatch(docs, /required project schema|initial-pilot requirement/);
});

test("eng verify surface remains offline and bounded", () => {
  const eng = read("eng.ps1");
  const invocationLines = eng
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("& "));
  assert.deepEqual(invocationLines, [
    "& git --version",
    "& node --version",
    "& git diff --check",
    "& node scripts/validate-operational-pilot.mjs",
    "& node scripts/validate-active-tree-boundaries.mjs",
    "& node scripts/validate-operational-status.mjs",
    "& node scripts/validate-resource-scenarios.mjs",
    "& node scripts/validate-resource-transitions.mjs",
    "& node scripts/validate-resource-trace-summaries.mjs",
    "& node scripts/validate-scenario-suites.mjs",
    "& node scripts/validate-op-3-failure-recovery.mjs",
    "& node --test",
    "& node src/cli.mjs status --json",
    "& node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json --json",
    "& node src/cli.mjs run-scenario fixtures/runs/nominal-resource-run.v1.json --json",
    "& node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json",
    "& node src/cli.mjs summarize-scenario fixtures/runs/nominal-resource-run.v1.json --json",
    "& node src/cli.mjs run-suite fixtures/suites/core-resource-regression.v1.json --json",
    "& node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json"
  ]);
  assert.match(eng, /node src\/cli\.mjs run-suite fixtures\/suites\/invalid\/expectation-mismatch\.v1\.json --json|node src\\cli\.mjs run-suite fixtures\/suites\/invalid\/expectation-mismatch\.v1\.json --json/);
  assert.doesNotMatch(
    eng,
    /pip install|npm install|npm ci|pnpm|npx|gunicorn|flask run|python (?:app|main)\.py|Invoke-Expression|Invoke-WebRequest|Invoke-RestMethod|curl |wget|git push|git fetch|git pull|git clone|git add|git commit|Remove-Item|Set-Content|New-Item|Out-File|Tee-Object|Start-Process/
  );
});

test("preserved legacy branch resolves to the documented baseline", () => {
  const refs = [
    "refs/heads/legacy/pre-orbital-compute-lab",
    "refs/remotes/origin/legacy/pre-orbital-compute-lab"
  ];
  const head = refs
    .map((ref) => {
      try {
        return execFileSync("git", ["rev-parse", "--verify", ref], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"]
        }).trim();
      } catch {
        return null;
      }
    })
    .find(Boolean);
  assert.equal(head, baselineSha);
});

test("active docs are consolidated and obsolete planning docs are absent", () => {
  for (const file of [
    "docs/product-charter.md",
    "docs/verification-plan.md",
    "docs/incubation/i0.5-measurements.md",
    "docs/incubation/i0.5-harness-friction.md",
    "scripts/validate-incubation-charter.mjs",
    "scripts/validate-clean-skeleton.mjs",
    "tests/incubation-charter.test.mjs"
  ]) {
    assert.equal(fs.existsSync(file), false, `${file} should be absent`);
  }
  assert.equal(fs.existsSync("docs/incubation/evaluations"), false);
  assert.equal(fs.existsSync("docs/operational-pilot.md"), true);
  assert.equal(fs.existsSync("docs/history/harness-evaluations.md"), true);
});

test("roadmap remains product-capability only", () => {
  const roadmap = read("docs/roadmap.md");
  assert.match(roadmap, /Status: `controlled_test_range`/);
  assert.match(roadmap, /R3 - Next Meaningful Product Increment/);
  assert.match(roadmap, /R2 - Controlled Test Range Surface[\s\S]*?Status: complete/);
  assert.match(roadmap, /R4 - Deterministic Failure-State Scenarios[\s\S]*?Status: complete/);
  assert.match(roadmap, /R5 - Product Direction Decision[\s\S]*?Status: complete/);
  assert.match(roadmap, /retain Orbital as a maintained controlled offline test range/);
  assert.doesNotMatch(roadmap, /OP-1|OP-2|OP-3|OP-4/);
});

test("operational pilot records local OP-4 closure without becoming harness authority", () => {
  const pilot = read("docs/operational-pilot.md");
  assert.match(pilot, /Current milestone: `OP-4`/);
  assert.match(pilot, /Status: `complete`/);
  assert.match(pilot, /Terminal OP-3 reviewed source/);
  assert.match(pilot, /R2 local controlled-test-range surface: `complete`/);
  assert.match(pilot, /R4 deterministic failure-state scenarios: `complete`/);
  assert.match(pilot, /R5 local product-direction decision: `complete`/);
  assert.match(pilot, /harness repository owns v0\.2 closure and the v0\.3 decision/);
});
