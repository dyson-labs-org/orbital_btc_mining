import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const reportPath = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-report.v1.json";
const timingPath = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-timing.v1.json";
const tmpRoot = ".agent-harness/tmp/op-3-failure-recovery";
const redirectTarget = ".agent-harness/artifacts/op-3-failure-recovery/redirect-target";
const pathGuardSandbox = ".agent-harness/artifacts/op-3-failure-recovery/path-guard-sandbox";
const repoRoot = process.cwd();
const repoRootAbsolute = path.resolve(repoRoot);
const repoRootReal = fs.realpathSync.native(repoRootAbsolute);

function sameFilesystemPath(left, right) {
  const normalize = process.platform === "win32"
    ? (value) => path.normalize(value).toLowerCase()
    : (value) => path.normalize(value);
  return normalize(left) === normalize(right);
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function displayPath(absolutePath) {
  return path.relative(repoRootAbsolute, absolutePath).replaceAll("\\", "/") || ".";
}

function assertSafeExistingParents(label, target) {
  const absolutePath = path.resolve(repoRootAbsolute, target);
  assert.equal(isWithin(repoRootAbsolute, absolutePath), true, `${label} must stay within the repository root`);
  const parent = path.dirname(absolutePath);
  const relativeParent = path.relative(repoRootAbsolute, parent);
  if (relativeParent === "") {
    return;
  }

  let current = repoRootAbsolute;
  for (const part of relativeParent.split(path.sep)) {
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
    assert.equal(stat.isSymbolicLink(), false, `${label} parent has a symlink or reparse-point component: ${displayPath(current)}`);
    const real = fs.realpathSync.native(current);
    const expectedReal = path.join(repoRootReal, path.relative(repoRootAbsolute, current));
    assert.equal(
      sameFilesystemPath(real, expectedReal),
      true,
      `${label} parent resolves outside the lexical repository path: ${displayPath(current)}`
    );
  }
}

function mkdirSafe(target) {
  assertSafeExistingParents("test mkdir target", target);
  fs.mkdirSync(target, { recursive: true });
}

function writeFileSafe(target, contents) {
  assertSafeExistingParents("test write target", target);
  fs.writeFileSync(target, contents);
}

function removePathOrLink(target) {
  assertSafeExistingParents("test cleanup target", target);
  try {
    const stat = fs.lstatSync(target);
    if (!stat.isSymbolicLink()) {
      fs.rmSync(target, { recursive: true, force: true });
      return;
    }
    try {
      fs.unlinkSync(target);
    } catch (error) {
      if (process.platform === "win32" && ["EPERM", "EISDIR", "ENOTDIR"].includes(error.code)) {
        fs.rmdirSync(target);
        return;
      }
      throw error;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function runValidator() {
  return spawnSync(process.execPath, ["scripts/validate-op-3-failure-recovery.mjs"], {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" }
  });
}

function assertNoMachineLocalPath(text) {
  assert.equal(text.includes(repoRootAbsolute), false);
  assert.equal(text.includes(repoRootAbsolute.replaceAll("\\", "/")), false);
  assert.equal(text.includes("file://"), false);
}

test("OP-3 failure recovery validator produces the expected diagnosis and rollback proof", () => {
  const result = runValidator();
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const report = JSON.parse(result.stdout);

  assert.equal(report.schema_version, "op-3-failure-recovery-report.v1");
  assert.equal(report.status, "passed");
  assert.equal(report.baseline_status, "passed");
  assert.equal(report.controlled_failure_status, "passed");
  assert.equal(report.child_exit_code, 1);
  assert.equal(report.observed_failure_phase, "suite_expectation_check");
  assert.deepEqual(report.observed_failure_codes, ["outcome_mismatch", "constraint_codes_mismatch"]);
  assert.equal(report.failure_classification, "pilot_introduced");
  assert.equal(report.baseline_state_sha256, report.restored_state_sha256);
  assert.notEqual(report.baseline_state_sha256, report.failed_state_sha256);
  assert.equal(report.byte_for_byte_restoration, "passed");
  assert.equal(report.rollback_status, "passed");
  assert.equal(report.orphaned_state_count, 0);
  assert.equal(report.recovery_status, "passed");
  assert.equal(report.tracked_worktree_mutation_result, "none_detected");
  assert.equal(report.external_effects, "none");
  assert.equal(report.repeatability.status, "passed");
  assert.equal(report.repeatability.repetitions, 3);
  assert.equal(report.path_safety.status, "passed");
  assert.equal(report.observed_failure_case_id, "nominal-resource-run");
  assert.equal(report.failed_case_count, 1);
  assert.equal(fs.existsSync(tmpRoot), false);
});

test("OP-3 validator rejects redirected disposable state before mutation", (t) => {
  removePathOrLink(tmpRoot);
  removePathOrLink(redirectTarget);
  mkdirSafe(path.dirname(tmpRoot));
  mkdirSafe(redirectTarget);
  const sentinel = path.join(redirectTarget, "sentinel.txt");
  writeFileSafe(sentinel, "keep\n");

  try {
    fs.symlinkSync(path.resolve(redirectTarget), tmpRoot, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    removePathOrLink(redirectTarget);
    t.skip(`directory symlink unavailable: ${error.code ?? error.message}`);
    return;
  }

  try {
    const result = runValidator();
    const diagnostic = result.stderr + result.stdout;
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(diagnostic, /unsafe OP-3 path configuration|symlink|reparse-point/);
    assertNoMachineLocalPath(diagnostic);
    assert.equal(fs.readFileSync(sentinel, "utf8"), "keep\n");
  } finally {
    removePathOrLink(tmpRoot);
    assert.equal(fs.existsSync(sentinel), true);
    removePathOrLink(redirectTarget);
  }
});

test("OP-3 test path guard rejects redirected parents before cleanup mutation", (t) => {
  removePathOrLink(pathGuardSandbox);
  mkdirSafe(pathGuardSandbox);
  const parentRedirect = path.join(pathGuardSandbox, "redirected-parent");
  const parentTarget = path.join(pathGuardSandbox, "parent-target");
  mkdirSafe(parentTarget);
  const sentinel = path.join(parentTarget, "sentinel.txt");
  writeFileSafe(sentinel, "keep\n");

  try {
    fs.symlinkSync(path.resolve(parentTarget), parentRedirect, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    removePathOrLink(parentTarget);
    removePathOrLink(pathGuardSandbox);
    t.skip(`directory symlink unavailable: ${error.code ?? error.message}`);
    return;
  }

  try {
    assert.throws(
      () => removePathOrLink(path.join(parentRedirect, "child.txt")),
      /symlink|reparse-point|resolves outside/
    );
    assert.equal(fs.readFileSync(sentinel, "utf8"), "keep\n");
  } finally {
    removePathOrLink(parentRedirect);
    removePathOrLink(parentTarget);
    removePathOrLink(pathGuardSandbox);
  }
});

test("OP-3 deterministic report is separate from nondeterministic timing evidence", () => {
  const result = runValidator();
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(fs.existsSync(reportPath), true);
  assert.equal(fs.existsSync(timingPath), true);

  const reportText = fs.readFileSync(reportPath, "utf8");
  const timing = JSON.parse(fs.readFileSync(timingPath, "utf8"));
  assert.doesNotMatch(reportText, /elapsed_ms/);
  assert.equal(timing.schema_version, "op-3-failure-recovery-timing.v1");
  assert.equal(timing.status, "recorded");
  assert.equal(timing.runs.length, 3);
});
