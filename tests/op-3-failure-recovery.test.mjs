import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";

const reportPath = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-report.v1.json";
const timingPath = ".agent-harness/artifacts/op-3-failure-recovery/op-3-failure-recovery-timing.v1.json";
const tmpRoot = ".agent-harness/tmp/op-3-failure-recovery";

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
  assert.equal(fs.existsSync(tmpRoot), false);
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
