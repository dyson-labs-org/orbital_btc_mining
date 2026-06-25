import { validateScenarioDocument } from "./resource-scenario.mjs";
import { runResourceScenario } from "./resource-transition.mjs";

export const RESOURCE_TRACE_SUMMARY_SCHEMA_VERSION = "resource-trace-summary.v1";
export const RESOURCE_TRACE_SUMMARY_RUN_SCHEMA_VERSION = "resource-trace-summary-run.v1";

export const RESOURCE_TRACE_TOTAL_FIELDS = Object.freeze([
  "solar_input_millijoules",
  "curtailed_solar_millijoules",
  "base_load_millijoules",
  "energy_shortfall_millijoules",
  "thermal_input_millijoules",
  "thermal_dissipation_millijoules",
  "thermal_excess_millijoules",
  "downlink_capacity_bytes"
]);

const FINAL_STATE_FIELDS = Object.freeze([
  "battery_energy_millijoules",
  "battery_capacity_millijoules",
  "thermal_load_millijoules",
  "thermal_capacity_millijoules"
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function error(code, path, message) {
  return { code, path, message };
}

function arithmeticError(path, operation) {
  return error("arithmetic_overflow", path, `Safe-integer arithmetic overflow during ${operation}.`);
}

function requireSafeInteger(value, path) {
  if (!Number.isSafeInteger(value)) {
    throw error("invalid_summary_input", path, "Value must be a safe integer before summary aggregation.");
  }
  return value;
}

function safeAdd(a, b, path) {
  requireSafeInteger(a, path);
  requireSafeInteger(b, path);
  const value = a + b;
  if (!Number.isSafeInteger(value)) {
    throw arithmeticError(path, "addition");
  }
  return value;
}

function safeMultiply(a, b, path) {
  requireSafeInteger(a, path);
  requireSafeInteger(b, path);
  const value = a * b;
  if (!Number.isSafeInteger(value)) {
    throw arithmeticError(path, "multiplication");
  }
  return value;
}

function emptyTotals() {
  return {
    solar_input_millijoules: 0,
    curtailed_solar_millijoules: 0,
    base_load_millijoules: 0,
    energy_shortfall_millijoules: 0,
    thermal_input_millijoules: 0,
    thermal_dissipation_millijoules: 0,
    thermal_excess_millijoules: 0,
    downlink_capacity_bytes: 0,
    communications_available_steps: 0,
    communications_unavailable_steps: 0
  };
}

function cloneFinalState(finalState) {
  if (!isPlainObject(finalState)) {
    throw error("invalid_transition_result", "$.final_state", "Transition final_state must be an object.");
  }
  const state = {};
  for (const field of FINAL_STATE_FIELDS) {
    state[field] = requireSafeInteger(finalState[field], `$.final_state.${field}`);
  }
  return state;
}

function validateTransitionResultShape(transitionResult, stepDurationMs) {
  if (!isPlainObject(transitionResult)) {
    throw error("invalid_transition_result", "$", "Transition result must be an object.");
  }
  if (!Number.isSafeInteger(stepDurationMs) || stepDurationMs <= 0) {
    throw error("invalid_summary_input", "$.step_duration_ms", "Step duration must be a positive safe integer.");
  }
  if (typeof transitionResult.scenario_id !== "string" || transitionResult.scenario_id.length === 0) {
    throw error("invalid_transition_result", "$.scenario_id", "Transition result must have a nonempty scenario_id.");
  }
  if (!["completed", "constraint_violation"].includes(transitionResult.outcome)) {
    throw error("invalid_transition_result", "$.outcome", "Transition outcome must be completed or constraint_violation.");
  }
  if (!Number.isSafeInteger(transitionResult.processed_steps) || transitionResult.processed_steps < 0) {
    throw error("invalid_transition_result", "$.processed_steps", "processed_steps must be a nonnegative safe integer.");
  }
  if (!Array.isArray(transitionResult.step_results)) {
    throw error("invalid_transition_result", "$.step_results", "step_results must be an array.");
  }
  if (transitionResult.step_results.length !== transitionResult.processed_steps) {
    throw error("invalid_transition_result", "$.processed_steps", "processed_steps must equal step_results length.");
  }
  if (!Array.isArray(transitionResult.constraint_violations)) {
    throw error("invalid_transition_result", "$.constraint_violations", "constraint_violations must be an array.");
  }
}

function summarizeConstraints(violations) {
  const ordered = [];
  const byCode = new Map();
  violations.forEach((violation, index) => {
    if (!isPlainObject(violation)) {
      throw error("invalid_transition_result", `$.constraint_violations[${index}]`, "Constraint violation must be an object.");
    }
    if (typeof violation.code !== "string" || violation.code.length === 0) {
      throw error("invalid_transition_result", `$.constraint_violations[${index}].code`, "Constraint code must be a nonempty string.");
    }
    const amount = requireSafeInteger(violation.amount_millijoules, `$.constraint_violations[${index}].amount_millijoules`);
    if (!byCode.has(violation.code)) {
      const item = {
        code: violation.code,
        count: 0,
        total_amount_millijoules: 0
      };
      byCode.set(violation.code, item);
      ordered.push(item);
    }
    const item = byCode.get(violation.code);
    item.count = safeAdd(item.count, 1, `$.constraint_summary.${violation.code}.count`);
    item.total_amount_millijoules = safeAdd(
      item.total_amount_millijoules,
      amount,
      `$.constraint_summary.${violation.code}.total_amount_millijoules`
    );
  });
  return ordered;
}

function buildSummary(transitionResult, stepDurationMs) {
  validateTransitionResultShape(transitionResult, stepDurationMs);
  const totals = emptyTotals();

  transitionResult.step_results.forEach((step, index) => {
    if (!isPlainObject(step)) {
      throw error("invalid_transition_result", `$.step_results[${index}]`, "Step result must be an object.");
    }
    for (const field of RESOURCE_TRACE_TOTAL_FIELDS) {
      totals[field] = safeAdd(totals[field], requireSafeInteger(step[field], `$.step_results[${index}].${field}`), `$.totals.${field}`);
    }
    if (step.communications_available === true) {
      totals.communications_available_steps = safeAdd(totals.communications_available_steps, 1, "$.totals.communications_available_steps");
    } else if (step.communications_available === false) {
      totals.communications_unavailable_steps = safeAdd(totals.communications_unavailable_steps, 1, "$.totals.communications_unavailable_steps");
    } else {
      throw error("invalid_transition_result", `$.step_results[${index}].communications_available`, "communications_available must be Boolean.");
    }
  });

  return {
    schema_version: RESOURCE_TRACE_SUMMARY_SCHEMA_VERSION,
    scenario_id: transitionResult.scenario_id,
    outcome: transitionResult.outcome,
    processed_steps: transitionResult.processed_steps,
    total_duration_ms: safeMultiply(transitionResult.processed_steps, stepDurationMs, "$.total_duration_ms"),
    totals,
    final_state: cloneFinalState(transitionResult.final_state),
    constraint_summary: summarizeConstraints(transitionResult.constraint_violations)
  };
}

function summarizeOk(summary) {
  return {
    ok: true,
    process_status: "domain_success",
    summary,
    errors: []
  };
}

function summarizeFailure(processStatus, errors) {
  return {
    ok: false,
    process_status: processStatus,
    summary: null,
    errors
  };
}

export function summarizeTransitionResult(transitionResult, { stepDurationMs }) {
  try {
    return summarizeOk(buildSummary(transitionResult, stepDurationMs));
  } catch (caught) {
    const item = caught && typeof caught === "object" && "code" in caught
      ? caught
      : error("unexpected_internal_error", "$", "Unexpected resource trace summary failure.");
    const status = item.code === "invalid_summary_input" || item.code === "invalid_transition_result"
      ? "invalid_input"
      : "internal_error";
    return summarizeFailure(status, [item]);
  }
}

export function summarizeResourceScenario(scenario) {
  const run = runResourceScenario(scenario);
  if (!run.ok) {
    return summarizeFailure(run.process_status, run.errors);
  }
  return summarizeTransitionResult(run.result, { stepDurationMs: scenario.step_duration_ms });
}

export function summarizeScenarioDocument(text) {
  const parsed = validateScenarioDocument(text);
  if (!parsed.ok) {
    return summarizeFailure("invalid_input", parsed.errors);
  }
  return summarizeResourceScenario(parsed.scenario);
}

export function traceSummaryPayload(result) {
  return {
    schema_version: RESOURCE_TRACE_SUMMARY_RUN_SCHEMA_VERSION,
    ok: result.ok,
    process_status: result.process_status,
    outcome: result.summary?.outcome ?? null,
    scenario_id: result.summary?.scenario_id ?? null,
    summary: result.summary,
    errors: result.errors
  };
}
