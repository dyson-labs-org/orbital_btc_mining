#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import process from "node:process";
import { getStatus } from "../src/status.mjs";
import { validateOperationalStatus } from "../src/domain/operational-status.mjs";

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function addFailure(failures, code, path, message, details = {}) {
  failures.push({ code, path, message, ...details });
}

function runStatusJson() {
  return execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" }
  });
}

const failures = [];
const inProcess = getStatus();
const inProcessValidation = validateOperationalStatus(inProcess);
if (!inProcessValidation.ok) {
  for (const item of inProcessValidation.errors) {
    addFailure(failures, item.code, item.path, item.message, { source: "in_process" });
  }
}

let firstOutput = "";
let secondOutput = "";
let parsed = null;
try {
  firstOutput = runStatusJson();
  secondOutput = runStatusJson();
} catch (error) {
  addFailure(failures, "status_cli_failed", "$", "status --json exited nonzero.", { detail: error.message });
}

if (firstOutput && secondOutput && firstOutput !== secondOutput) {
  addFailure(failures, "status_cli_not_deterministic", "$", "Repeated status --json output differed.");
}

if (firstOutput) {
  try {
    parsed = JSON.parse(firstOutput);
  } catch (error) {
    addFailure(failures, "status_cli_invalid_json", "$", "status --json did not emit valid JSON.", { detail: error.message });
  }
}

if (parsed) {
  const cliValidation = validateOperationalStatus(parsed);
  if (!cliValidation.ok) {
    for (const item of cliValidation.errors) {
      addFailure(failures, item.code, item.path, item.message, { source: "cli" });
    }
  }
  if (stableJson(parsed) !== stableJson(inProcess)) {
    addFailure(failures, "status_cli_mismatch", "$", "CLI status object differs from in-process status object.");
  }
}

const summary = {
  schema_version: "operational-status-validator.v1",
  validator: "operational-status",
  status: failures.length === 0 ? "passed" : "failed",
  in_process_validation: inProcessValidation.ok ? "passed" : "failed",
  cli_validation: parsed ? "executed" : "failed",
  deterministic_cli_bytes: firstOutput && secondOutput && firstOutput === secondOutput ? "passed" : "failed",
  failures
};

process.stdout.write(stableJson(summary));
if (failures.length > 0) {
  process.exit(1);
}