import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const reportPath = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-report.v1.json";
const timingPath = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-timing.v1.json";
const tmpRoot = ".agent-harness/tmp/op-3-failure-recovery";
const redirectTarget = ".agent-harness/artifacts/op-3-failure-recovery/redirect-target";

function removePathOrLink(target) {
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
  fs.rmSync(redirectTarget, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(tmpRoot), { recursive: true });
  fs.mkdirSync(redirectTarget, { recursive: true });
  const sentinel = path.join(redirectTarget, "sentinel.txt");
  fs.writeFileSync(sentinel, "keep\n");

  try {
    fs.symlinkSync(path.resolve(redirectTarget), tmpRoot, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    fs.rmSync(redirectTarget, { recursive: true, force: true });
    t.skip(`directory symlink unavailable: ${error.code ?? error.message}`);
    return;
  }

  try {
    const result = runValidator();
    assert.notEqual(result.status, 0, result.stdout);
    assert.match(result.stderr + result.stdout, /unsafe OP-3 path configuration|symlink|reparse-point/);
    assert.equal(fs.readFileSync(sentinel, "utf8"), "keep\n");
  } finally {
    removePathOrLink(tmpRoot);
    assert.equal(fs.existsSync(sentinel), true);
    fs.rmSync(redirectTarget, { recursive: true, force: true });
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
