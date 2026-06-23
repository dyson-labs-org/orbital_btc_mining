import fs from "node:fs";
import path from "node:path";
import { runScenarioDocument } from "./resource-transition.mjs";

const SUITE_SCHEMA_VERSION = "scenario-suite.v1";
const RUN_SCHEMA_VERSION = "scenario-suite-run.v1";
const APPROVED_SCENARIO_ROOT = "fixtures/runs/";
const EXPECTED_OUTCOMES = new Set(["completed", "constraint_violation"]);
const rootFields = ["schema_version", "suite_id", "cases"];
const caseFields = ["case_id", "scenario_path", "expected_outcome", "expected_constraint_codes"];

function error(code, pathExpression, message) {
  return { code, path: pathExpression, message };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkKnownFields(value, allowed, pathExpression, errors) {
  for (const field of Object.keys(value).sort()) {
    if (!allowed.includes(field)) {
      errors.push(error("unknown_field", `${pathExpression}.${field}`, `Unknown field: ${field}.`));
    }
  }
}

function checkRequiredFields(value, required, pathExpression, errors) {
  for (const field of required) {
    if (!Object.hasOwn(value, field)) {
      errors.push(error("missing_field", `${pathExpression}.${field}`, `Missing required field: ${field}.`));
    }
  }
}

function checkNonemptyString(value, pathExpression, errors) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(error("invalid_string", pathExpression, "Value must be a nonempty string."));
    return false;
  }
  return true;
}

function normalizeScenarioPath(value, pathExpression, errors) {
  if (!checkNonemptyString(value, pathExpression, errors)) {
    return null;
  }
  if (/^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/") || value.startsWith("\\\\") || value.startsWith("//")) {
    errors.push(error("absolute_path", pathExpression, "scenario_path must be repository-relative."));
    return null;
  }
  if (value.includes("\\")) {
    errors.push(error("invalid_path_separator", pathExpression, "scenario_path must use forward slashes."));
    return null;
  }
  const parts = value.split("/");
  if (parts.some((part) => part === "" || part === ".")) {
    errors.push(error("invalid_path_segment", pathExpression, "scenario_path must be normalized."));
    return null;
  }
  if (parts.includes("..")) {
    errors.push(error("path_traversal", pathExpression, "scenario_path must not contain traversal."));
    return null;
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value) {
    errors.push(error("invalid_path_segment", pathExpression, "scenario_path must already be normalized."));
    return null;
  }
  if (!normalized.startsWith(APPROVED_SCENARIO_ROOT)) {
    errors.push(error("path_outside_fixture_root", pathExpression, `scenario_path must be under ${APPROVED_SCENARIO_ROOT}.`));
    return null;
  }
  return normalized;
}

function validateExpectedConstraintCodes(value, pathExpression, errors) {
  if (!Array.isArray(value)) {
    errors.push(error("invalid_constraint_codes", pathExpression, "expected_constraint_codes must be an array."));
    return null;
  }
  const seen = new Set();
  const codes = [];
  value.forEach((code, index) => {
    const codePath = `${pathExpression}[${index}]`;
    if (!checkNonemptyString(code, codePath, errors)) {
      return;
    }
    if (seen.has(code)) {
      errors.push(error("duplicate_constraint_code", codePath, `Duplicate expected constraint code: ${code}.`));
      return;
    }
    seen.add(code);
    codes.push(code);
  });
  return codes;
}

function validateCase(item, index, seenCaseIds, errors) {
  const pathExpression = `$.cases[${index}]`;
  if (!isPlainObject(item)) {
    errors.push(error("invalid_type", pathExpression, "Suite case must be an object."));
    return null;
  }

  checkRequiredFields(item, ["case_id", "scenario_path", "expected_outcome"], pathExpression, errors);
  checkKnownFields(item, caseFields, pathExpression, errors);

  const caseId = Object.hasOwn(item, "case_id") && checkNonemptyString(item.case_id, `${pathExpression}.case_id`, errors)
    ? item.case_id
    : null;
  if (caseId) {
    if (seenCaseIds.has(caseId)) {
      errors.push(error("duplicate_case_id", `${pathExpression}.case_id`, `Duplicate case_id: ${caseId}.`));
    }
    seenCaseIds.add(caseId);
  }

  const scenarioPath = Object.hasOwn(item, "scenario_path")
    ? normalizeScenarioPath(item.scenario_path, `${pathExpression}.scenario_path`, errors)
    : null;

  let expectedOutcome = null;
  if (Object.hasOwn(item, "expected_outcome")) {
    if (checkNonemptyString(item.expected_outcome, `${pathExpression}.expected_outcome`, errors)) {
      if (!EXPECTED_OUTCOMES.has(item.expected_outcome)) {
        errors.push(error("invalid_expected_outcome", `${pathExpression}.expected_outcome`, "expected_outcome must be completed or constraint_violation."));
      } else {
        expectedOutcome = item.expected_outcome;
      }
    }
  }

  const hasExpectedCodes = Object.hasOwn(item, "expected_constraint_codes");
  const expectedConstraintCodes = hasExpectedCodes
    ? validateExpectedConstraintCodes(item.expected_constraint_codes, `${pathExpression}.expected_constraint_codes`, errors)
    : null;

  return {
    case_id: caseId,
    scenario_path: scenarioPath,
    expected_outcome: expectedOutcome,
    expected_constraint_codes: hasExpectedCodes ? (expectedConstraintCodes ?? []) : null
  };
}

export function parseScenarioSuiteJson(text) {
  try {
    return { ok: true, suite: JSON.parse(text), errors: [] };
  } catch {
    return {
      ok: false,
      suite: null,
      errors: [error("invalid_json", "$", "Scenario suite document must be valid JSON.")]
    };
  }
}

export function validateScenarioSuite(suite) {
  const errors = [];
  const normalizedCases = [];

  if (!isPlainObject(suite)) {
    errors.push(error("invalid_type", "$", "Scenario suite must be an object."));
    return { ok: false, suite: null, errors };
  }

  checkRequiredFields(suite, rootFields, "$", errors);
  checkKnownFields(suite, rootFields, "$", errors);

  if (Object.hasOwn(suite, "schema_version") && suite.schema_version !== SUITE_SCHEMA_VERSION) {
    errors.push(error("invalid_schema_version", "$.schema_version", `schema_version must be ${SUITE_SCHEMA_VERSION}.`));
  }

  const suiteId = Object.hasOwn(suite, "suite_id") && checkNonemptyString(suite.suite_id, "$.suite_id", errors)
    ? suite.suite_id
    : null;

  if (Object.hasOwn(suite, "cases")) {
    if (!Array.isArray(suite.cases)) {
      errors.push(error("invalid_type", "$.cases", "cases must be an array."));
    } else if (suite.cases.length === 0) {
      errors.push(error("empty_cases", "$.cases", "cases must contain at least one case."));
    } else {
      const seenCaseIds = new Set();
      suite.cases.forEach((item, index) => {
        const normalized = validateCase(item, index, seenCaseIds, errors);
        if (normalized) {
          normalizedCases.push(normalized);
        }
      });
    }
  }

  return {
    ok: errors.length === 0,
    suite: errors.length === 0
      ? {
          schema_version: SUITE_SCHEMA_VERSION,
          suite_id: suiteId,
          cases: normalizedCases
        }
      : null,
    errors
  };
}

export function validateScenarioSuiteDocument(text) {
  const parsed = parseScenarioSuiteJson(text);
  if (!parsed.ok) {
    return parsed;
  }
  return validateScenarioSuite(parsed.suite);
}

export function validateScenarioSuiteFile(filePath) {
  try {
    return validateScenarioSuiteDocument(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {
      ok: false,
      suite: null,
      errors: [error("suite_file_not_found", "$", "Scenario suite file could not be read.")]
    };
  }
}

function emptyResult({ suiteId = null, ok = false, processStatus = "invalid_input", errors = [] } = {}) {
  return {
    ok,
    process_status: processStatus,
    suite_id: suiteId,
    outcome: "failed",
    case_count: 0,
    passed_case_count: 0,
    failed_case_count: 0,
    cases: [],
    errors
  };
}

function readScenario(repositoryRoot, scenarioPath) {
  try {
    return { ok: true, text: fs.readFileSync(path.join(repositoryRoot, scenarioPath), "utf8"), errors: [] };
  } catch {
    return {
      ok: false,
      text: "",
      errors: [error("scenario_file_not_found", "$.scenario_path", "Referenced scenario file could not be read.")]
    };
  }
}

function constraintCodesFor(result) {
  return result.result?.constraint_violations?.map((item) => item.code) ?? [];
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function caseResultFor(item, runResult) {
  const actualOutcome = runResult.result?.outcome ?? null;
  const actualConstraintCodes = constraintCodesFor(runResult);
  const failureCodes = [];
  if (actualOutcome !== item.expected_outcome) {
    failureCodes.push("outcome_mismatch");
  }
  if (item.expected_constraint_codes !== null && !arraysEqual(actualConstraintCodes, item.expected_constraint_codes)) {
    failureCodes.push("constraint_codes_mismatch");
  }
  return {
    case_id: item.case_id,
    scenario_path: item.scenario_path,
    expected_outcome: item.expected_outcome,
    actual_outcome: actualOutcome,
    expected_constraint_codes: item.expected_constraint_codes,
    actual_constraint_codes: actualConstraintCodes,
    matched: failureCodes.length === 0,
    failure_codes: failureCodes
  };
}

export function runScenarioSuite(suite, { repositoryRoot = process.cwd() } = {}) {
  const validation = validateScenarioSuite(suite);
  if (!validation.ok) {
    return emptyResult({ suiteId: isPlainObject(suite) && typeof suite.suite_id === "string" ? suite.suite_id : null, errors: validation.errors });
  }

  const cases = [];
  const errors = [];
  let processStatus = "suite_completed";

  for (const item of validation.suite.cases) {
    const read = readScenario(repositoryRoot, item.scenario_path);
    if (!read.ok) {
      errors.push(...read.errors.map((entry) => ({ ...entry, case_id: item.case_id })));
      cases.push({
        case_id: item.case_id,
        scenario_path: item.scenario_path,
        expected_outcome: item.expected_outcome,
        actual_outcome: null,
        expected_constraint_codes: item.expected_constraint_codes,
        actual_constraint_codes: [],
        matched: false,
        failure_codes: ["scenario_file_not_found"]
      });
      processStatus = "invalid_input";
      continue;
    }

    const runResult = runScenarioDocument(read.text);
    if (!runResult.ok) {
      errors.push(...runResult.errors.map((entry) => ({ ...entry, case_id: item.case_id })));
      cases.push({
        case_id: item.case_id,
        scenario_path: item.scenario_path,
        expected_outcome: item.expected_outcome,
        actual_outcome: null,
        expected_constraint_codes: item.expected_constraint_codes,
        actual_constraint_codes: [],
        matched: false,
        failure_codes: [runResult.process_status === "internal_error" ? "internal_error" : "invalid_scenario"]
      });
      processStatus = runResult.process_status === "internal_error" ? "internal_error" : "invalid_input";
      continue;
    }

    cases.push(caseResultFor(item, runResult));
  }

  const passedCaseCount = cases.filter((item) => item.matched).length;
  const failedCaseCount = cases.length - passedCaseCount;
  const scenarioFailure = processStatus === "invalid_input" || processStatus === "internal_error";
  return {
    ok: !scenarioFailure,
    process_status: processStatus,
    suite_id: validation.suite.suite_id,
    outcome: failedCaseCount === 0 && !scenarioFailure ? "passed" : "failed",
    case_count: cases.length,
    passed_case_count: passedCaseCount,
    failed_case_count: failedCaseCount,
    cases,
    errors
  };
}

export function runScenarioSuiteDocument(text, options = {}) {
  const parsed = parseScenarioSuiteJson(text);
  if (!parsed.ok) {
    return emptyResult({ errors: parsed.errors });
  }
  return runScenarioSuite(parsed.suite, options);
}

export function runScenarioSuiteFile(filePath, options = {}) {
  try {
    return runScenarioSuiteDocument(fs.readFileSync(filePath, "utf8"), options);
  } catch {
    return emptyResult({ errors: [error("suite_file_not_found", "$", "Scenario suite file could not be read.")] });
  }
}

export function suiteRunPayload(result) {
  return {
    schema_version: RUN_SCHEMA_VERSION,
    ok: result.ok,
    process_status: result.process_status,
    suite_id: result.suite_id,
    outcome: result.outcome,
    case_count: result.case_count,
    passed_case_count: result.passed_case_count,
    failed_case_count: result.failed_case_count,
    cases: result.cases,
    errors: result.errors
  };
}
