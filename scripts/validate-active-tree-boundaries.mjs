#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "package.json",
  "src/index.mjs",
  "src/status.mjs",
  "src/cli.mjs",
  "src/domain/resource-scenario.mjs",
  "src/domain/resource-transition.mjs",
  "src/domain/resource-trace-summary.mjs",
  "src/domain/scenario-suite.mjs",
  "src/domain/operational-status.mjs",
  "tests/unit/status.test.mjs",
  "tests/unit/operational-status.test.mjs",
  "tests/unit/cli.test.mjs",
  "tests/unit/package-boundary.test.mjs",
  "tests/unit/resource-scenario.test.mjs",
  "tests/unit/resource-scenario-cli.test.mjs",
  "tests/unit/resource-transition.test.mjs",
  "tests/unit/resource-trace-summary.test.mjs",
  "tests/unit/resource-trace-summary-cli.test.mjs",
  "tests/unit/resource-run-cli.test.mjs",
  "tests/unit/scenario-suite.test.mjs",
  "tests/unit/scenario-suite-cli.test.mjs",
  "tests/operational-pilot.test.mjs",
  "docs/operational-pilot.md",
  "docs/safety-boundaries.md",
  "docs/roadmap.md",
  "docs/history/harness-evaluations.md",
  "docs/legacy-removal-manifest.md",
  "docs/legacy-source-access.md",
  "docs/architecture/ADR-0003-node-standard-library-skeleton.md",
  "docs/architecture/ADR-0004-resource-scenario-contract.md",
  "docs/architecture/ADR-0005-deterministic-resource-transitions.md",
  "docs/architecture/ADR-0006-deterministic-scenario-suites.md",
  "docs/simulation/resource-scenario-v1.md",
  "docs/simulation/resource-transition-v1.md",
  "docs/simulation/resource-trace-summary-v1.md",
  "docs/simulation/scenario-suite-v1.md",
  "docs/contracts/operational-status-v1.md",
  "scripts/validate-scenario-suites.mjs",
  "scripts/validate-resource-trace-summaries.mjs",
  "scripts/validate-operational-status.mjs",
  "fixtures/summaries/nominal-resource-run-summary.v1.json",
  "fixtures/summaries/energy-deficit-summary.v1.json",
  "fixtures/summaries/combined-constraints-summary.v1.json"
];

const forbiddenActivePaths = [
  "analysis",
  "config",
  "costmodel",
  "launch",
  "orbits",
  "power",
  "radiation",
  "templates",
  "app.py",
  "main.py",
  "requirements.txt",
  "render.yaml",
  "Procfile",
  "readme.txt",
  "LICENSE",
  ".python-version",
  "autocommit.py",
  "codex_merge.py",
  "docs/product-charter.md",
  "docs/verification-plan.md",
  "docs/incubation/i0.5-measurements.md",
  "docs/incubation/i0.5-harness-friction.md",
  "scripts/validate-incubation-charter.mjs",
  "scripts/validate-clean-skeleton.mjs",
  "tests/incubation-charter.test.mjs"
];

const lockfiles = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb"
];

const forbiddenImports = [
  "child_process",
  "cluster",
  "dgram",
  "dns",
  "http",
  "https",
  "net",
  "tls",
  "worker_threads"
];

const forbiddenCalls = [
  "fetch",
  "WebSocket",
  "XMLHttpRequest",
  "spawn",
  "exec",
  "execFile",
  "fork"
];

const forbiddenActiveTerms = [
  "private key",
  "seed phrase",
  "mining pool",
  "bitcoin rpc",
  "transaction broadcast",
  "exchange trading",
  "btcpay",
  "scrap portal",
  "aws credentials",
  "openai",
  "anthropic",
  "hosted model",
  "wallet.dat"
];

function relPath(...parts) {
  return path.join(root, ...parts);
}

function exists(relativePath) {
  return fs.existsSync(relPath(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(relPath(relativePath), "utf8");
}

function listFiles(dir) {
  if (!exists(dir)) {
    return [];
  }
  const base = relPath(dir);
  return fs.readdirSync(base, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .map((absolute) => path.relative(root, absolute).replaceAll("\\", "/"));
}

for (const file of requiredFiles) {
  if (!exists(file)) {
    failures.push(`missing required active-tree file: ${file}`);
  }
}

for (const legacyPath of forbiddenActivePaths) {
  if (exists(legacyPath)) {
    failures.push(`forbidden active path remains: ${legacyPath}`);
  }
}

if (exists("docs/incubation/evaluations")) {
  failures.push("obsolete cycle plan/result/friction directory remains: docs/incubation/evaluations");
}

for (const lockfile of lockfiles) {
  if (exists(lockfile)) {
    failures.push(`lockfile must not exist: ${lockfile}`);
  }
}

if (exists(".agent-harness/project.json")) {
  failures.push("unexpected .agent-harness/project.json");
}

let packageJson = {};
if (exists("package.json")) {
  try {
    packageJson = JSON.parse(read("package.json"));
  } catch (error) {
    failures.push(`package.json parse failed: ${error.message}`);
  }
}

if (packageJson.name !== "orbital-compute-lab") {
  failures.push("package name must be orbital-compute-lab");
}
if (packageJson.private !== true) {
  failures.push("package must be private");
}
if (packageJson.version !== "0.0.0") {
  failures.push("package version must be 0.0.0");
}
if (packageJson.type !== "module") {
  failures.push("package type must be module");
}
if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
  failures.push("package must not have dependencies");
}
if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0) {
  failures.push("package must not have devDependencies");
}
if (packageJson.workspaces) {
  failures.push("package must not define workspaces");
}
if (packageJson.publishConfig) {
  failures.push("package must not define publishConfig");
}

const scripts = packageJson.scripts ?? {};
if (scripts["validate:pilot"] !== "node scripts/validate-operational-pilot.mjs") {
  failures.push("package validate:pilot script mismatch");
}
if (scripts["validate:active-tree"] !== "node scripts/validate-active-tree-boundaries.mjs") {
  failures.push("package validate:active-tree script mismatch");
}
if (scripts.verify !== "node scripts/validate-active-tree-boundaries.mjs") {
  failures.push("package verify script mismatch");
}
if (scripts["validate:charter"] || scripts["validate:skeleton"]) {
  failures.push("obsolete package validator script remains");
}
for (const lifecycle of ["preinstall", "install", "postinstall", "prepare", "prepublish", "prepack", "postpack"]) {
  if (scripts[lifecycle]) {
    failures.push(`package lifecycle script is forbidden: ${lifecycle}`);
  }
}
for (const [name, script] of Object.entries(scripts)) {
  if (/[;&|`$<>]/.test(script)) {
    failures.push(`package script must not use shell metacharacters: ${name}`);
  }
  if (/\b(?:npm|pnpm|npx|curl|wget|Invoke-WebRequest|Invoke-RestMethod|gunicorn|flask|python)\b/i.test(script)) {
    failures.push(`package script contains forbidden command: ${name}`);
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
  if (status.product_name !== "Orbital Compute Lab") {
    failures.push("status product_name mismatch");
  }
  if (status.repository !== "dyson-labs-org/orbital_btc_mining") {
    failures.push("status repository mismatch");
  }
  if (status.maturity !== "operational_pilot") {
    failures.push("status maturity must be operational_pilot");
  }
  if (status.implementation_status !== "controlled_test_range") {
    failures.push("status implementation_status must be controlled_test_range");
  }
  if (status.version !== packageJson.version) {
    failures.push("status version must match package version");
  }
  if (status.runtime?.minimum_version !== "22") {
    failures.push("status runtime minimum version must be 22");
  }
  const requiredFalseCapabilities = [
    "simulation_kernel",
    "orbital_resource_model",
    "bitcoin_workload_model",
    "ai_workload_model",
    "workload_scheduler",
    "scheduler",
    "profitability_model",
    "telemetry",
    "anomaly_detection",
    "live_bitcoin",
    "wallet",
    "trading",
    "hosted_ai",
    "external_network",
    "hardware_control",
    "mission_authority"
  ];
  for (const capability of ["resource_scenario_contract", "resource_scenario_validation", "deterministic_resource_transition", "scenario_suite_contract", "scenario_suite_runner", "resource_trace_summary"]) {
    if (status.capabilities?.[capability] !== true) {
      failures.push(`status capability must be true: ${capability}`);
    }
  }
  for (const capability of requiredFalseCapabilities) {
    if (status.capabilities?.[capability] !== false) {
      failures.push(`status capability must be false: ${capability}`);
    }
  }
}

const activeFiles = listFiles("src");
for (const file of activeFiles) {
  const text = read(file);
  for (const mod of forbiddenImports) {
    const importPattern = new RegExp(`from\\s+["']node:${mod}["']|from\\s+["']${mod}["']|import\\(["']node:${mod}["']\\)|import\\(["']${mod}["']\\)`);
    if (importPattern.test(text)) {
      failures.push(`${file} imports forbidden module: ${mod}`);
    }
  }
  for (const call of forbiddenCalls) {
    const callPattern = new RegExp(`\\b${call}\\s*\\(`);
    if (callPattern.test(text)) {
      failures.push(`${file} calls forbidden API: ${call}`);
    }
  }
  const lower = text.toLowerCase();
  for (const term of forbiddenActiveTerms) {
    if (lower.includes(term)) {
      failures.push(`${file} refers to forbidden active term: ${term}`);
    }
  }
}

if (exists(".gitignore")) {
  const gitignore = read(".gitignore");
  for (const ignored of [".agent-harness/artifacts/", ".agent-harness/tmp/", "audit-output/"]) {
    if (!gitignore.includes(ignored)) {
      failures.push(`.gitignore missing ignored artifact root: ${ignored}`);
    }
  }
}

const legacyAccess = exists("docs/legacy-source-access.md") ? read("docs/legacy-source-access.md") : "";
if (!legacyAccess.includes("legacy/pre-orbital-compute-lab") || !legacyAccess.includes("c93c7366edcd86b83896c3c39b753805183c3126")) {
  failures.push("legacy source access document must name preserved branch and commit");
}

for (const file of ["README.md", "AGENTS.md", "docs/operational-pilot.md", "docs/safety-boundaries.md", "docs/roadmap.md"]) {
  if (!exists(file)) {
    continue;
  }
  const text = read(file).toLowerCase();
  if (text.includes("profitability claim") || text.includes("profitable") || text.includes("orbital feasibility proven")) {
    failures.push(`${file} must not claim profitability or orbital feasibility`);
  }
  if (/simulation (?:kernel )?(?:is )?(?:implemented|complete)/.test(text)) {
    failures.push(`${file} must not claim simulation is implemented`);
  }
}

const summary = {
  validator: "active-tree-boundaries",
  status: failures.length === 0 ? "passed" : "failed",
  active_tree_status: "controlled_test_range",
  dependency_installation: "not_required",
  external_service_calls: "none",
  failures
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
