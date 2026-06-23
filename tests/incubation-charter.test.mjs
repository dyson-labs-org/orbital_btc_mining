import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const baselineSha = "c93c7366edcd86b83896c3c39b753805183c3126";

test("charter validator passes", () => {
  const output = execFileSync(process.execPath, ["scripts/validate-incubation-charter.mjs"], {
    encoding: "utf8"
  });
  const summary = JSON.parse(output);
  assert.equal(summary.status, "passed");
  assert.equal(summary.charter_status, "incubation");
  assert.equal(summary.legacy_source, "not_run");
  assert.equal(summary.external_calls, "none");
  assert.equal(summary.product_implementation, "skeleton");
});

test("task contract records incubation status and project-json gap", () => {
  const task = JSON.parse(fs.readFileSync(".agent-harness/tasks/i0-audit-recharter.task.json", "utf8"));
  assert.equal(task.baseline_sha, baselineSha);
  assert.equal(task.preserved_branch, "legacy/pre-orbital-compute-lab");
  assert.equal(task.work_branch, "incubation/orbital-compute-lab-charter");
  assert.equal(task.classification, "incubation");
  assert.equal(task.release_gate, "I0 Audit/Re-charter");
  assert.equal(task.project_json.status, "not_created");
  assert.equal(fs.existsSync(".agent-harness/project.json"), false);
});

test("eng verify surface remains offline and bounded", () => {
  const eng = fs.readFileSync("eng.ps1", "utf8");
  const invocationLines = eng
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("& "));
  assert.deepEqual(invocationLines, [
    "& git --version",
    "& node --version",
    "& git diff --check",
    "& node scripts/validate-incubation-charter.mjs",
    "& node scripts/validate-clean-skeleton.mjs",
    "& node --test",
    "& node src/cli.mjs status --json"
  ]);
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

test("roadmap contains all incubation gates", () => {
  const roadmap = fs.readFileSync("docs/roadmap.md", "utf8");
  for (const gate of [
    "I0 - Audit/Re-charter",
    "I1 - Deterministic Simulation Kernel",
    "I2 - Workload/Scheduler",
    "I3 - Explainability/Telemetry",
    "I4 - Optional Local AI Advisor Evaluation",
    "I5 - Incubation Demonstrator",
    "1.0 Decision Gate"
  ]) {
    assert.ok(roadmap.includes(gate));
  }
});
