#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "eng.ps1",
  ".agent-harness/README.md",
  "docs/operational-pilot.md",
  "docs/safety-boundaries.md",
  "docs/legacy-inventory.md",
  "docs/audit-report.md",
  "docs/research-assumptions.md",
  "docs/roadmap.md",
  "docs/history/harness-evaluations.md",
  "docs/architecture/ADR-0001-recharter-as-orbital-compute-lab.md",
  "docs/architecture/ADR-0002-deterministic-offline-first.md",
  "docs/architecture/ADR-0003-node-standard-library-skeleton.md",
  "docs/legacy-removal-manifest.md",
  "docs/legacy-source-access.md",
  "scripts/validate-operational-pilot.mjs",
  "scripts/validate-active-tree-boundaries.mjs",
  "tests/operational-pilot.test.mjs"
];

const removedActivePaths = [
  "docs/product-charter.md",
  "docs/verification-plan.md",
  "docs/incubation/i0.5-measurements.md",
  "docs/incubation/i0.5-harness-friction.md",
  "docs/incubation/evaluations/cycle-1-plan.md",
  "docs/incubation/evaluations/cycle-1-results.md",
  "docs/incubation/evaluations/cycle-1-friction-register.md",
  "docs/incubation/evaluations/cycle-2-plan.md",
  "docs/incubation/evaluations/cycle-2-results.md",
  "docs/incubation/evaluations/cycle-2-friction-register.md",
  "docs/incubation/evaluations/cycle-3-plan.md",
  "docs/incubation/evaluations/cycle-3-results.md",
  "docs/incubation/evaluations/cycle-3-friction-register.md",
  "scripts/validate-incubation-charter.mjs",
  "scripts/validate-clean-skeleton.mjs",
  "tests/incubation-charter.test.mjs"
];

const requiredText = {
  "README.md": [
    "operational pilot and controlled test range",
    "Product stage: controlled test range",
    "node scripts/validate-operational-pilot.mjs",
    "node scripts/validate-active-tree-boundaries.mjs",
    "External service calls during verification"
  ],
  "AGENTS.md": [
    "operational pilot and controlled test range",
    "Reviewed pilot branches may add or remove dependencies",
    "Do not create `.agent-harness/project.json` for OP-0"
  ],
  "docs/operational-pilot.md": [
    "Classification: `operational_pilot`",
    "Current milestone: `OP-0`",
    "C3-HARNESS-004 status: `open / accepted_for_offline_v0.2`",
    "No `.agent-harness/project.json` is required for OP-0",
    "No consumed schema exists"
  ],
  "docs/safety-boundaries.md": [
    "Prohibited External Side Effects",
    "mutation of `legacy/pre-orbital-compute-lab`",
    "Canonical KB writes before a reviewed gate"
  ],
  "docs/roadmap.md": [
    "Status: `controlled_test_range`",
    "R3 - Next Meaningful Product Increment",
    "Product capability claims require committed implementation"
  ],
  "docs/history/harness-evaluations.md": [
    "Cycle 1",
    "Cycle 2",
    "Cycle 3",
    "C3-HARNESS-004 remains `open / accepted_for_offline_v0.2`"
  ],
  ".agent-harness/README.md": [
    "OP-0 intentionally does not include `.agent-harness/project.json`",
    "No consumed harness schema exists",
    "node scripts/validate-operational-pilot.mjs"
  ]
};

const activeDocs = [
  "README.md",
  "AGENTS.md",
  ".agent-harness/README.md",
  "docs/operational-pilot.md",
  "docs/safety-boundaries.md",
  "docs/roadmap.md",
  "docs/history/harness-evaluations.md"
];

const forbiddenActiveSnippets = [
  "validate-incubation-charter.mjs",
  "validate-clean-skeleton.mjs",
  "docs/product-charter.md",
  "docs/verification-plan.md",
  "docs/incubation/evaluations/",
  "Status: incubation skeleton",
  "Product implementation: skeleton",
  "Incubation stage:"
];

const forbiddenEngText = [
  "pip install",
  "npm install",
  "pnpm",
  "npx",
  "gunicorn",
  "flask run",
  "python app.py",
  "python main.py",
  "Invoke-WebRequest",
  "Invoke-RestMethod",
  "curl ",
  "wget",
  "git push",
  "git fetch",
  "git pull",
  "git clone",
  "git add",
  "git commit",
  "Remove-Item",
  "Set-Content",
  "New-Item",
  "Out-File",
  "Tee-Object",
  "Start-Process"
];

const allowedEngInvocations = new Set([
  "& git --version",
  "& node --version",
  "& git diff --check",
  "& node scripts/validate-operational-pilot.mjs",
  "& node scripts/validate-active-tree-boundaries.mjs",
  "& node scripts/validate-resource-scenarios.mjs",
  "& node scripts/validate-resource-transitions.mjs",
  "& node scripts/validate-scenario-suites.mjs",
  "& node --test",
  "& node src/cli.mjs status --json",
  "& node src/cli.mjs validate-scenario fixtures/scenarios/minimal-sunlit.v1.json --json",
  "& node src/cli.mjs run-scenario fixtures/runs/nominal-resource-run.v1.json --json",
  "& node src/cli.mjs run-scenario fixtures/runs/energy-deficit.v1.json --json",
  "& node src/cli.mjs run-scenario fixtures/scenarios/invalid/malformed-json.v1.json --json",
  "& node src/cli.mjs run-suite fixtures/suites/core-resource-regression.v1.json --json",
  "& node src/cli.mjs run-suite fixtures/suites/constraint-regression.v1.json --json",
  "& node src/cli.mjs run-suite fixtures/suites/invalid/expectation-mismatch.v1.json --json"
]);

const baselineSha = "c93c7366edcd86b83896c3c39b753805183c3126";
const preservedBranch = "legacy/pre-orbital-compute-lab";

function relPath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(relPath(relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(relPath(relativePath));
}

function gitRevParse(ref) {
  try {
    return execFileSync("git", ["rev-parse", "--verify", ref], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

for (const relPath of requiredFiles) {
  if (!exists(relPath)) {
    failures.push(`missing required file: ${relPath}`);
  }
}

for (const relPath of removedActivePaths) {
  if (exists(relPath)) {
    failures.push(`obsolete active path still exists: ${relPath}`);
  }
}

if (exists(".agent-harness/project.json")) {
  failures.push("unexpected .agent-harness/project.json");
}

for (const [relPath, snippets] of Object.entries(requiredText)) {
  if (!exists(relPath)) {
    continue;
  }
  const text = read(relPath);
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      failures.push(`${relPath} missing required text: ${snippet}`);
    }
  }
}

for (const relPath of activeDocs) {
  if (!exists(relPath)) {
    continue;
  }
  const text = read(relPath);
  for (const snippet of forbiddenActiveSnippets) {
    if (text.includes(snippet)) {
      failures.push(`${relPath} contains obsolete active text: ${snippet}`);
    }
  }
  if (/\bincubation\b/i.test(text)) {
    failures.push(`${relPath} uses obsolete active classification: incubation`);
  }
}

if (exists("eng.ps1")) {
  const eng = read("eng.ps1");
  for (const snippet of forbiddenEngText) {
    if (eng.includes(snippet)) {
      failures.push(`eng.ps1 contains forbidden execution surface: ${snippet}`);
    }
  }
  const invocationLines = eng
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("& "));
  for (const line of invocationLines) {
    if (!allowedEngInvocations.has(line)) {
      failures.push(`eng.ps1 contains unapproved external invocation: ${line}`);
    }
  }
}

if (exists(".gitignore")) {
  const gitignore = read(".gitignore");
  for (const ignored of [".agent-harness/artifacts/", ".agent-harness/tmp/", "audit-output/"]) {
    if (!gitignore.includes(ignored)) {
      failures.push(`.gitignore missing ignored artifact path: ${ignored}`);
    }
  }
}

let status = null;
try {
  status = JSON.parse(execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" }
  }));
} catch (error) {
  failures.push(`status CLI JSON failed: ${error.message}`);
}

if (status) {
  if (status.maturity !== "operational_pilot") {
    failures.push("status maturity must be operational_pilot");
  }
  if (status.implementation_status !== "controlled_test_range") {
    failures.push("status implementation_status must be controlled_test_range");
  }
}

const preservedHead =
  gitRevParse(`refs/heads/${preservedBranch}`) ??
  gitRevParse(`refs/remotes/origin/${preservedBranch}`);
if (preservedHead !== baselineSha) {
  failures.push(`preserved branch ${preservedBranch} must resolve to ${baselineSha}`);
}

const summary = {
  validator: "operational-pilot",
  status: failures.length === 0 ? "passed" : "failed",
  pilot_status: "operational_pilot",
  active_tree_status: "controlled_test_range",
  legacy_source: "not_run",
  external_calls: "none",
  project_json: "not_created",
  failures
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}