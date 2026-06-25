#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REPORT_SCHEMA_VERSION = "op-3-failure-recovery-report.v1";
const PLAN_PATH = "fixtures/recovery/op-3-failure-recovery-plan.v1.json";
const REPORT_PATH = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-report.v1.json";
const TIMING_PATH = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-timing.v1.json";
const EXPECTED_SOURCE_SUITE = "fixtures/suites/core-resource-regression.v1.json";
const EXPECTED_DISPOSABLE_ROOT = ".agent-harness/tmp/op-3-failure-recovery/";
const EXPECTED_EVIDENCE_ROOT = ".agent-harness/artifacts/op-3-failure-recovery/";
const EXPECTED_WORKSPACE_SUITE = ".agent-harness/tmp/op-3-failure-recovery/workspace/core-resource-regression.v1.json";
const LEGACY_BRANCH = "legacy/pre-orbital-compute-lab";
const LEGACY_SHA = "c93c7366edcd86b83896c3c39b753805183c3126";
const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const root = process.cwd();
const rootAbsolute = path.resolve(root);
const rootReal = fs.realpathSync.native(rootAbsolute);

function abs(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(abs(relativePath), "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return sha256(Buffer.from(text, "utf8"));
}

function normalizeOutput(buffer) {
  return buffer.toString("utf8").replace(/\r\n/g, "\n");
}

function runNode(argv) {
  const result = spawnSync(process.execPath, argv, {
    cwd: root,
    encoding: "buffer",
    env: { PATH: process.env.PATH ?? "" }
  });
  return {
    argv: ["node", ...argv],
    exit_code: result.status,
    stdout: normalizeOutput(result.stdout ?? Buffer.from("")),
    stderr: normalizeOutput(result.stderr ?? Buffer.from("")),
    stdout_sha256: sha256(result.stdout ?? Buffer.from("")),
    stderr_sha256: sha256(result.stderr ?? Buffer.from("")),
    stdout_bytes: (result.stdout ?? Buffer.from("")).length,
    stderr_bytes: (result.stderr ?? Buffer.from("")).length
  };
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" }
  });
  return {
    exit_code: result.status,
    stdout: (result.stdout ?? "").replace(/\r\n/g, "\n"),
    stderr: (result.stderr ?? "").replace(/\r\n/g, "\n")
  };
}

function listFilesIfPresent(relativePath) {
  const target = abs(relativePath);
  if (!fs.existsSync(target)) {
    return [];
  }
  const found = [];
  const stack = [target];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else {
        found.push(path.relative(root, entryPath).replaceAll("\\", "/"));
      }
    }
  }
  return found.sort();
}

function countLines(text) {
  return text.split("\n").filter((line) => line.length > 0).length;
}

function parseSuitePayload(child) {
  try {
    return JSON.parse(child.stdout);
  } catch {
    return null;
  }
}

function arraysEqual(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function displayPath(absolutePath) {
  return path.relative(rootAbsolute, absolutePath).replaceAll("\\", "/") || ".";
}

function sameFilesystemPath(left, right) {
  const normalize = process.platform === "win32"
    ? (value) => value.toLowerCase()
    : (value) => value;
  return normalize(path.normalize(left)) === normalize(path.normalize(right));
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveRepoRelativePath(label, relativePath, failures) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    failures.push(`${label} must be a non-empty repository-relative path`);
    return null;
  }
  if (path.isAbsolute(relativePath)) {
    failures.push(`${label} must not be absolute`);
    return null;
  }
  const absolutePath = path.resolve(rootAbsolute, relativePath);
  if (!isWithin(rootAbsolute, absolutePath)) {
    failures.push(`${label} must stay within the repository root`);
    return null;
  }
  return absolutePath;
}

function collectRedirectFailures(label, absolutePath) {
  const failures = [];
  if (!isWithin(rootAbsolute, absolutePath)) {
    failures.push(`${label} must stay within the repository root`);
    return failures;
  }

  const relative = path.relative(rootAbsolute, absolutePath);
  if (relative === "") {
    return failures;
  }

  let current = rootAbsolute;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    let stat = null;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") {
        break;
      }
      throw error;
    }
    if (stat.isSymbolicLink()) {
      failures.push(`${label} has a symlink or reparse-point path component: ${displayPath(current)}`);
      continue;
    }
    const real = fs.realpathSync.native(current);
    const expectedReal = path.join(rootReal, path.relative(rootAbsolute, current));
    if (!sameFilesystemPath(real, expectedReal)) {
      failures.push(`${label} resolves outside the lexical repository path at: ${displayPath(current)}`);
    }
  }
  return failures;
}

function evaluatePathSafety(plan) {
  const failures = [];
  if (plan.source_suite !== EXPECTED_SOURCE_SUITE) {
    failures.push(`source_suite must be ${EXPECTED_SOURCE_SUITE}`);
  }
  if (plan.disposable_state_root !== EXPECTED_DISPOSABLE_ROOT) {
    failures.push(`disposable_state_root must be ${EXPECTED_DISPOSABLE_ROOT}`);
  }
  if (plan.ignored_evidence_root !== EXPECTED_EVIDENCE_ROOT) {
    failures.push(`ignored_evidence_root must be ${EXPECTED_EVIDENCE_ROOT}`);
  }
  if (plan.workspace_suite !== EXPECTED_WORKSPACE_SUITE) {
    failures.push(`workspace_suite must be ${EXPECTED_WORKSPACE_SUITE}`);
  }

  const resolved = {
    source_suite: resolveRepoRelativePath("source_suite", plan.source_suite, failures),
    workspace_suite: resolveRepoRelativePath("workspace_suite", plan.workspace_suite, failures),
    disposable_state_root: resolveRepoRelativePath("disposable_state_root", plan.disposable_state_root, failures),
    ignored_evidence_root: resolveRepoRelativePath("ignored_evidence_root", plan.ignored_evidence_root, failures),
    report_path: resolveRepoRelativePath("report_path", REPORT_PATH, failures),
    timing_path: resolveRepoRelativePath("timing_path", TIMING_PATH, failures)
  };

  if (resolved.workspace_suite && resolved.disposable_state_root && !isWithin(resolved.disposable_state_root, resolved.workspace_suite)) {
    failures.push("workspace_suite must remain beneath disposable_state_root");
  }
  if (resolved.report_path && resolved.ignored_evidence_root && !isWithin(resolved.ignored_evidence_root, resolved.report_path)) {
    failures.push("report_path must remain beneath ignored_evidence_root");
  }
  if (resolved.timing_path && resolved.ignored_evidence_root && !isWithin(resolved.ignored_evidence_root, resolved.timing_path)) {
    failures.push("timing_path must remain beneath ignored_evidence_root");
  }

  for (const [label, absolutePath] of Object.entries(resolved)) {
    if (absolutePath) {
      failures.push(...collectRedirectFailures(label, absolutePath));
    }
  }

  return {
    status: failures.length === 0 ? "passed" : "failed",
    checks: [
      "fixed_repository_relative_paths",
      "workspace_under_disposable_state_root",
      "evidence_under_ignored_artifact_root",
      "no_existing_symlink_or_reparse_components"
    ],
    failures
  };
}

function assertPathSafety(plan) {
  const safety = evaluatePathSafety(plan);
  if (safety.status !== "passed") {
    throw new Error(`unsafe OP-3 path configuration: ${safety.failures.join("; ")}`);
  }
  return safety;
}

function validatePlan(plan) {
  const failures = [];
  if (plan.schema_version !== "op-3-failure-recovery-plan.v1") {
    failures.push("plan schema_version must be op-3-failure-recovery-plan.v1");
  }
  for (const field of ["source_suite", "workspace_suite", "disposable_state_root", "ignored_evidence_root", "controlled_failure"]) {
    if (!plan[field]) {
      failures.push(`plan missing ${field}`);
    }
  }
  if (!Array.isArray(plan.regression_hashes) || plan.regression_hashes.length !== 7) {
    failures.push("plan must define seven regression hashes");
  }
  failures.push(...evaluatePathSafety(plan).failures);
  return failures;
}

function expectedChildArgv(plan) {
  return ["src/cli.mjs", "run-suite", plan.workspace_suite, "--json"];
}

function seedWorkspace(plan) {
  assertPathSafety(plan);
  fs.rmSync(abs(plan.disposable_state_root), { recursive: true, force: true });
  fs.mkdirSync(path.dirname(abs(plan.workspace_suite)), { recursive: true });
  assertPathSafety(plan);
  const baselineBytes = fs.readFileSync(abs(plan.source_suite));
  fs.writeFileSync(abs(plan.workspace_suite), baselineBytes);
  return baselineBytes;
}

function injectFailure(plan) {
  assertPathSafety(plan);
  const suite = readJson(plan.workspace_suite);
  const targetCase = suite.cases.find((item) => item.case_id === plan.controlled_failure.case_id);
  if (!targetCase) {
    throw new Error(`controlled failure case not found: ${plan.controlled_failure.case_id}`);
  }
  targetCase.expected_outcome = plan.controlled_failure.expected_outcome;
  targetCase.expected_constraint_codes = [...plan.controlled_failure.expected_constraint_codes];
  fs.writeFileSync(abs(plan.workspace_suite), stableJson(suite));
}

function firstFailedCase(payload) {
  return payload?.cases?.find((item) => item.matched === false) ?? null;
}

function failurePhase(payload) {
  if (payload?.process_status === "suite_completed" && payload?.outcome === "failed") {
    return "suite_expectation_check";
  }
  if (payload?.process_status) {
    return payload.process_status;
  }
  return "unknown";
}

function ignoredByGit(relativePath) {
  return runGit(["check-ignore", "-q", relativePath]).exit_code === 0;
}

function legacyBranchStatus() {
  const local = runGit(["rev-parse", "--verify", `refs/heads/${LEGACY_BRANCH}`]);
  const remote = runGit(["rev-parse", "--verify", `refs/remotes/origin/${LEGACY_BRANCH}`]);
  const resolved = local.exit_code === 0 ? local.stdout.trim() : remote.stdout.trim();
  return {
    branch: LEGACY_BRANCH,
    expected_sha: LEGACY_SHA,
    observed_sha: resolved,
    status: resolved === LEGACY_SHA ? "passed" : "failed"
  };
}

function runRegressionHashes(plan) {
  const checks = {};
  const failures = [];
  for (const item of plan.regression_hashes) {
    const child = runNode(item.argv);
    const passed = child.exit_code === 0 &&
      child.stdout_sha256 === item.stdout_sha256 &&
      child.stderr_sha256 === EMPTY_SHA256 &&
      child.stdout_bytes === item.stdout_bytes &&
      child.stderr_bytes === 0;
    checks[item.id] = {
      status: passed ? "passed" : "failed",
      exit_code: child.exit_code,
      baseline_stdout_sha256: item.stdout_sha256,
      observed_stdout_sha256: child.stdout_sha256,
      baseline_stdout_bytes: item.stdout_bytes,
      observed_stdout_bytes: child.stdout_bytes,
      stderr_sha256: child.stderr_sha256,
      stderr_bytes: child.stderr_bytes
    };
    if (!passed) {
      failures.push(`${item.id} regression hash changed`);
    }
  }
  return {
    status: failures.length === 0 ? "passed" : "failed",
    checks,
    failures
  };
}

function runOneRehearsal(plan) {
  const timings = {};
  const statusBefore = runGit(["status", "--porcelain=v1"]).stdout;
  const cachedBefore = runGit(["diff", "--cached", "--name-only"]).stdout;
  let cleanupStatus = "failed";
  let orphanedStateCount = 0;
  let report = null;

  try {
    const baselineBytes = seedWorkspace(plan);
    const baselineStateSha256 = sha256(baselineBytes);
    const ignoredState = ignoredByGit(plan.workspace_suite);

    const baselineChild = runNode(expectedChildArgv(plan));
    const baselinePayload = parseSuitePayload(baselineChild);
    const baselineStatus = baselineChild.exit_code === 0 &&
      baselinePayload?.outcome === "passed" &&
      baselinePayload?.failed_case_count === 0
      ? "passed"
      : "failed";

    injectFailure(plan);
    const failedStateBytes = fs.readFileSync(abs(plan.workspace_suite));
    const failedStateSha256 = sha256(failedStateBytes);
    const failureChild = runNode(expectedChildArgv(plan));
    const failurePayload = parseSuitePayload(failureChild);
    const failedCase = firstFailedCase(failurePayload);
    const observedFailureCaseId = failedCase?.case_id ?? null;
    const failedCaseCount = failurePayload?.failed_case_count ?? null;
    const observedFailureCodes = failedCase?.failure_codes ?? [];
    const observedPhase = failurePhase(failurePayload);
    const expected = plan.controlled_failure;
    const controlledFailurePassed = failureChild.exit_code === expected.expected_child_exit_code &&
      observedPhase === expected.phase &&
      failedCaseCount === 1 &&
      observedFailureCaseId === expected.case_id &&
      arraysEqual(observedFailureCodes, expected.expected_failure_codes);

    const rollbackStart = process.hrtime.bigint();
    assertPathSafety(plan);
    fs.writeFileSync(abs(plan.workspace_suite), baselineBytes);
    const restoredBytes = fs.readFileSync(abs(plan.workspace_suite));
    const rollbackElapsedNs = process.hrtime.bigint() - rollbackStart;
    timings.rollback_elapsed_ms = Number(rollbackElapsedNs) / 1_000_000;
    const restoredStateSha256 = sha256(restoredBytes);
    const byteForByteRestoration = Buffer.compare(baselineBytes, restoredBytes) === 0;

    const recoveryStart = process.hrtime.bigint();
    const recoveryChild = runNode(expectedChildArgv(plan));
    const recoveryElapsedNs = process.hrtime.bigint() - recoveryStart;
    timings.recovery_elapsed_ms = Number(recoveryElapsedNs) / 1_000_000;
    const recoveryPayload = parseSuitePayload(recoveryChild);
    const recoveryStatus = recoveryChild.exit_code === 0 && recoveryPayload?.outcome === "passed" ? "passed" : "failed";

    fs.rmSync(abs(plan.disposable_state_root), { recursive: true, force: true });
    orphanedStateCount = listFilesIfPresent(plan.disposable_state_root).length;
    cleanupStatus = orphanedStateCount === 0 ? "passed" : "failed";

    const statusAfter = runGit(["status", "--porcelain=v1"]).stdout;
    const cachedAfter = runGit(["diff", "--cached", "--name-only"]).stdout;
    const stagedFileCount = countLines(cachedAfter);
    const trackedStatusIdentical = statusBefore === statusAfter && cachedBefore === cachedAfter;
    const legacy = legacyBranchStatus();
    const regressionHashes = runRegressionHashes(plan);

    const failures = [];
    if (baselineStatus !== "passed") failures.push("baseline disposable suite did not pass");
    if (!ignoredState) failures.push("controlled state was not ignored by Git");
    if (!controlledFailurePassed) failures.push("controlled failure diagnosis did not match expected nonzero result");
    if (failedCaseCount !== 1) failures.push("controlled failure must produce exactly one failed case");
    if (observedFailureCaseId !== expected.case_id) failures.push("controlled failure case_id did not match expected case");
    if (!byteForByteRestoration) failures.push("rollback did not restore baseline bytes");
    if (restoredStateSha256 !== baselineStateSha256) failures.push("rollback did not restore baseline SHA-256");
    if (cleanupStatus !== "passed") failures.push("cleanup left orphaned disposable state");
    if (stagedFileCount !== 0) failures.push("rehearsal left staged files");
    if (recoveryStatus !== "passed") failures.push("recovery command did not pass after rollback");
    if (!trackedStatusIdentical) failures.push("tracked Git status changed during rehearsal");
    if (legacy.status !== "passed") failures.push("legacy preservation branch SHA changed or is unavailable");
    failures.push(...regressionHashes.failures);

    report = {
      schema_version: REPORT_SCHEMA_VERSION,
      report_id: "op-3-failure-recovery",
      roadmap_mapping: plan.roadmap_mapping,
      orbital_base_commit: plan.orbital_base_commit,
      harness_source_commit: plan.harness_source_commit,
      clean_main_baseline: plan.clean_main_baseline,
      baseline_status: baselineStatus,
      controlled_failure_status: controlledFailurePassed ? "passed" : "failed",
      child_command: ["node", ...expectedChildArgv(plan)],
      child_exit_code: failureChild.exit_code,
      expected_child_exit_code: expected.expected_child_exit_code,
      expected_failure_phase: expected.phase,
      observed_failure_phase: observedPhase,
      expected_failure_codes: expected.expected_failure_codes,
      observed_failure_codes: observedFailureCodes,
      expected_failure_case_id: expected.case_id,
      observed_failure_case_id: observedFailureCaseId,
      failed_case_count: failedCaseCount,
      failure_classification: expected.classification,
      pre_existing_failure_list: baselineStatus === "passed" ? [] : ["baseline_disposable_suite_failed"],
      diagnosis: {
        case_id: expected.case_id,
        observed_case_id: observedFailureCaseId,
        phase: observedPhase,
        expected_outcome: failedCase?.expected_outcome ?? null,
        observed_outcome: failedCase?.actual_outcome ?? null,
        expected_constraint_codes: failedCase?.expected_constraint_codes ?? [],
        observed_constraint_codes: failedCase?.actual_constraint_codes ?? [],
        failure_codes: observedFailureCodes
      },
      disposable_state: {
        root: plan.disposable_state_root,
        workspace_suite: plan.workspace_suite,
        ignored_by_git: ignoredState ? "passed" : "failed"
      },
      path_safety: evaluatePathSafety(plan),
      baseline_state_sha256: baselineStateSha256,
      failed_state_sha256: failedStateSha256,
      restored_state_sha256: restoredStateSha256,
      byte_for_byte_restoration: byteForByteRestoration ? "passed" : "failed",
      rollback_status: byteForByteRestoration && restoredStateSha256 === baselineStateSha256 ? "passed" : "failed",
      orphaned_state_count: orphanedStateCount,
      staged_file_count: stagedFileCount,
      cleanup_status: cleanupStatus,
      recovery_status: recoveryStatus,
      tracked_worktree_mutation_result: trackedStatusIdentical ? "none_detected" : "changed",
      legacy_preservation: legacy,
      regression_hashes: regressionHashes,
      external_effects: "none",
      timing_measurements: "recorded_separately",
      skipped_checks: [],
      not_run_checks: [],
      failures,
      status: failures.length === 0 ? "passed" : "failed"
    };
    return { report, timings };
  } finally {
    fs.rmSync(abs(plan.disposable_state_root), { recursive: true, force: true });
    if (!report) {
      orphanedStateCount = listFilesIfPresent(plan.disposable_state_root).length;
      cleanupStatus = orphanedStateCount === 0 ? "passed" : "failed";
    }
  }
}

function main() {
  const plan = readJson(PLAN_PATH);
  const planFailures = validatePlan(plan);
  const reports = [];
  const timingRuns = [];
  if (planFailures.length === 0) {
    for (let index = 0; index < 3; index += 1) {
      const run = runOneRehearsal(plan);
      reports.push(run.report);
      timingRuns.push(run.timings);
    }
  }

  const reportBytes = reports.map((item) => stableJson(item));
  const deterministicRepeat = reportBytes.length === 3 &&
    reportBytes[0] === reportBytes[1] &&
    reportBytes[1] === reportBytes[2];
  const finalReport = reports[0] ?? {
    schema_version: REPORT_SCHEMA_VERSION,
    report_id: "op-3-failure-recovery",
    status: "failed",
    failures: planFailures
  };

  finalReport.repeatability = {
    status: deterministicRepeat ? "passed" : "failed",
    repetitions: reports.length,
    deterministic_report_sha256: reportBytes[0] ? sha256Text(reportBytes[0]) : null
  };
  if (!deterministicRepeat) {
    finalReport.status = "failed";
    finalReport.failures = [...(finalReport.failures ?? []), "three repeated deterministic reports were not byte-identical"];
  }
  if (planFailures.length > 0) {
    finalReport.status = "failed";
    finalReport.failures = [...(finalReport.failures ?? []), ...planFailures];
  }
  finalReport.path_safety = finalReport.path_safety ?? evaluatePathSafety(plan);

  assertPathSafety(plan);
  fs.mkdirSync(path.dirname(abs(REPORT_PATH)), { recursive: true });
  assertPathSafety(plan);
  fs.writeFileSync(abs(REPORT_PATH), stableJson(finalReport));
  fs.writeFileSync(abs(TIMING_PATH), stableJson({
    schema_version: "op-3-failure-recovery-timing.v1",
    report_id: "op-3-failure-recovery",
    status: "recorded",
    note: "Nondeterministic rollback and recovery elapsed times are intentionally excluded from the deterministic report.",
    runs: timingRuns
  }));

  process.stdout.write(stableJson(finalReport));
  return finalReport.status === "passed" ? 0 : 1;
}

function sanitizedDiagnostic(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replaceAll(rootAbsolute, ".")
    .replaceAll(rootAbsolute.replaceAll("\\", "/"), ".")
    .replaceAll(rootReal, ".")
    .replaceAll(rootReal.replaceAll("\\", "/"), ".");
}

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`${sanitizedDiagnostic(error)}\n`);
  process.exitCode = 1;
}
