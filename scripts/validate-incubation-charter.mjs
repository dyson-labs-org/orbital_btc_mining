#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const root = process.cwd();

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  "eng.ps1",
  ".agent-harness/README.md",
  ".agent-harness/tasks/i0-audit-recharter.task.json",
  "docs/product-charter.md",
  "docs/safety-boundaries.md",
  "docs/legacy-inventory.md",
  "docs/audit-report.md",
  "docs/research-assumptions.md",
  "docs/verification-plan.md",
  "docs/roadmap.md",
  "docs/architecture/ADR-0001-recharter-as-orbital-compute-lab.md",
  "docs/architecture/ADR-0002-deterministic-offline-first.md",
  "docs/architecture/ADR-0003-node-standard-library-skeleton.md",
  "docs/legacy-removal-manifest.md",
  "docs/legacy-source-access.md",
  "scripts/validate-incubation-charter.mjs",
  "scripts/validate-clean-skeleton.mjs",
  "tests/incubation-charter.test.mjs"
];

const requiredText = {
  "README.md": [
    "Orbital Compute Lab",
    "incubation",
    "legacy/pre-orbital-compute-lab",
    "c93c7366edcd86b83896c3c39b753805183c3126",
    "Product implementation: skeleton",
    "Status: incubation skeleton",
    "Legacy source: removed from active main",
    "External service calls during verification: none"
  ],
  "docs/product-charter.md": [
    "Incubation repository",
    "not an operational pilot",
    "No active Bitcoin mining",
    "I0 Exit Criteria"
  ],
  "docs/safety-boundaries.md": [
    "Not Authorized In I0",
    "pip install -r requirements.txt",
    "python app.py",
    "gunicorn app:app",
    "autocommit.py",
    "codex_merge.py"
  ],
  "docs/legacy-inventory.md": [
    "`package.json` scripts | empty",
    "`pnpm` workspace scripts | empty",
    "Portal health, invoice, integration, smoke, dispatch, executor commands | empty",
    "Local Absolute Paths"
  ],
  "docs/audit-report.md": [
    "not a gf-sdk JavaScript or TypeScript monorepo",
    "No likely active credential",
    "unresolved merge conflict markers",
    "ccdff5326cfd8f4b4123faebbeac477bb3d1235f",
    "does not advance an operational pilot gate"
  ],
  "docs/verification-plan.md": [
    "git diff --check",
    "node scripts/validate-incubation-charter.mjs",
    "node --test",
    "not_run",
    "empty",
    "noop"
  ],
  "docs/roadmap.md": [
    "I0 - Audit/Re-charter",
    "I1 - Deterministic Simulation Kernel",
    "I2 - Workload/Scheduler",
    "I3 - Explainability/Telemetry",
    "I4 - Optional Local AI Advisor Evaluation",
    "I5 - Incubation Demonstrator",
    "I0.5",
    "1.0 Decision Gate"
  ]
};

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
  "& node scripts/validate-incubation-charter.mjs",
  "& node scripts/validate-clean-skeleton.mjs",
  "& node --test",
  "& node src/cli.mjs status --json"
]);

const baselineSha = "c93c7366edcd86b83896c3c39b753805183c3126";
const preservedBranch = "legacy/pre-orbital-compute-lab";
const workBranch = "incubation/orbital-compute-lab-charter";

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
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

const failures = [];

for (const relPath of requiredFiles) {
  if (!exists(relPath)) {
    failures.push(`missing required file: ${relPath}`);
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

if (exists(".agent-harness/tasks/i0-audit-recharter.task.json")) {
  try {
    const task = JSON.parse(read(".agent-harness/tasks/i0-audit-recharter.task.json"));
    if (task.baseline_sha !== baselineSha) {
      failures.push("task baseline_sha does not match preserved baseline");
    }
    if (task.preserved_branch !== preservedBranch) {
      failures.push("task preserved_branch does not match required branch");
    }
    if (task.work_branch !== workBranch) {
      failures.push("task work_branch does not match required branch");
    }
    if (task.classification !== "incubation") {
      failures.push("task classification must be incubation");
    }
    if (task.product_implementation !== "not_started") {
      failures.push("task product implementation must be not_started");
    }
    if (task.external_calls !== "none") {
      failures.push("task external calls must be none");
    }
    if (task.legacy_source !== "not_run") {
      failures.push("task legacy source must be not_run");
    }
    if (task.project_json?.status !== "not_created") {
      failures.push("task must record .agent-harness/project.json as not_created");
    }
    for (const status of ["passed", "failed", "skipped", "not_run", "empty", "noop"]) {
      if (!task.status_vocabulary?.includes(status)) {
        failures.push(`task status vocabulary missing: ${status}`);
      }
    }
  } catch (error) {
    failures.push(`task JSON parse failed: ${error.message}`);
  }
}

const preservedHead =
  gitRevParse(`refs/heads/${preservedBranch}`) ??
  gitRevParse(`refs/remotes/origin/${preservedBranch}`);
if (preservedHead !== baselineSha) {
  failures.push(`preserved branch ${preservedBranch} must resolve to ${baselineSha}`);
}

const summary = {
  validator: "incubation-charter",
  status: failures.length === 0 ? "passed" : "failed",
  charter_status: "incubation",
  legacy_source: "not_run",
  external_calls: "none",
  product_implementation: "skeleton",
  failures
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
