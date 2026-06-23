const SCHEMA_VERSION = "resource-scenario.v1";

const rootFields = [
  "schema_version",
  "scenario_id",
  "step_duration_ms",
  "step_count",
  "initial_state",
  "environment_steps"
];

const initialStateFields = [
  "battery_energy_millijoules",
  "battery_capacity_millijoules",
  "thermal_load_millijoules",
  "thermal_capacity_millijoules"
];

const environmentStepFields = [
  "step",
  "solar_input_millijoules",
  "base_load_millijoules",
  "thermal_input_millijoules",
  "thermal_dissipation_millijoules",
  "communications_available",
  "downlink_capacity_bytes"
];

function error(code, path, message) {
  return { code, path, message };
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkKnownFields(value, allowed, path, errors) {
  for (const field of Object.keys(value).sort()) {
    if (!allowed.includes(field)) {
      errors.push(error("unknown_field", `${path}.${field}`, `Unknown field: ${field}.`));
    }
  }
}

function checkRequiredFields(value, required, path, errors) {
  for (const field of required) {
    if (!Object.hasOwn(value, field)) {
      errors.push(error("missing_field", `${path}.${field}`, `Missing required field: ${field}.`));
    }
  }
}

function checkSafeInteger(value, path, errors, { positive = false } = {}) {
  if (!Number.isSafeInteger(value)) {
    errors.push(error("invalid_integer", path, "Value must be a safe integer."));
    return false;
  }
  if (positive && value <= 0) {
    errors.push(error("nonpositive_integer", path, "Value must be a positive integer."));
    return false;
  }
  if (!positive && value < 0) {
    errors.push(error("negative_integer", path, "Value must be a nonnegative integer."));
    return false;
  }
  return true;
}

function checkString(value, path, errors) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(error("invalid_string", path, "Value must be a nonempty string."));
    return false;
  }
  return true;
}

function checkBoolean(value, path, errors) {
  if (typeof value !== "boolean") {
    errors.push(error("invalid_boolean", path, "Value must be a boolean."));
    return false;
  }
  return true;
}

function validateInitialState(initialState, errors) {
  const path = "$.initial_state";
  if (!isPlainObject(initialState)) {
    errors.push(error("invalid_type", path, "initial_state must be an object."));
    return;
  }

  checkRequiredFields(initialState, initialStateFields, path, errors);
  checkKnownFields(initialState, initialStateFields, path, errors);

  for (const field of initialStateFields) {
    if (Object.hasOwn(initialState, field)) {
      checkSafeInteger(initialState[field], `${path}.${field}`, errors);
    }
  }

  if (
    Number.isSafeInteger(initialState.battery_energy_millijoules) &&
    Number.isSafeInteger(initialState.battery_capacity_millijoules) &&
    initialState.battery_energy_millijoules > initialState.battery_capacity_millijoules
  ) {
    errors.push(error(
      "battery_over_capacity",
      "$.initial_state.battery_energy_millijoules",
      "Initial battery energy must not exceed battery capacity."
    ));
  }

  if (
    Number.isSafeInteger(initialState.thermal_load_millijoules) &&
    Number.isSafeInteger(initialState.thermal_capacity_millijoules) &&
    initialState.thermal_load_millijoules > initialState.thermal_capacity_millijoules
  ) {
    errors.push(error(
      "thermal_over_capacity",
      "$.initial_state.thermal_load_millijoules",
      "Initial thermal load must not exceed thermal capacity."
    ));
  }
}

function validateEnvironmentStep(step, expectedIndex, errors) {
  const path = `$.environment_steps[${expectedIndex}]`;
  if (!isPlainObject(step)) {
    errors.push(error("invalid_type", path, "Environment step must be an object."));
    return;
  }

  const required = environmentStepFields.filter((field) => field !== "downlink_capacity_bytes");
  checkRequiredFields(step, required, path, errors);
  checkKnownFields(step, environmentStepFields, path, errors);

  if (Object.hasOwn(step, "step") && checkSafeInteger(step.step, `${path}.step`, errors)) {
    if (step.step !== expectedIndex) {
      errors.push(error("step_index_mismatch", `${path}.step`, `Expected step index ${expectedIndex}.`));
    }
  }

  for (const field of [
    "solar_input_millijoules",
    "base_load_millijoules",
    "thermal_input_millijoules",
    "thermal_dissipation_millijoules"
  ]) {
    if (Object.hasOwn(step, field)) {
      checkSafeInteger(step[field], `${path}.${field}`, errors);
    }
  }

  if (Object.hasOwn(step, "communications_available")) {
    checkBoolean(step.communications_available, `${path}.communications_available`, errors);
  }

  if (Object.hasOwn(step, "downlink_capacity_bytes")) {
    checkSafeInteger(step.downlink_capacity_bytes, `${path}.downlink_capacity_bytes`, errors);
    if (step.communications_available === false && step.downlink_capacity_bytes !== 0) {
      errors.push(error(
        "downlink_unavailable",
        `${path}.downlink_capacity_bytes`,
        "Downlink capacity must be absent or zero when communications are unavailable."
      ));
    }
  }
}

function validateEnvironmentSteps(steps, stepCount, errors) {
  const path = "$.environment_steps";
  if (!Array.isArray(steps)) {
    errors.push(error("invalid_type", path, "environment_steps must be an array."));
    return;
  }

  if (Number.isSafeInteger(stepCount) && steps.length !== stepCount) {
    errors.push(error("environment_length_mismatch", path, "environment_steps length must equal step_count."));
  }

  steps.forEach((step, index) => {
    validateEnvironmentStep(step, index, errors);
  });
}

export function parseScenarioJson(text) {
  try {
    return { ok: true, scenario: JSON.parse(text), errors: [] };
  } catch {
    return {
      ok: false,
      scenario: null,
      errors: [error("invalid_json", "$", "Scenario document must be valid JSON.")]
    };
  }
}

export function validateResourceScenario(scenario) {
  const errors = [];

  if (!isPlainObject(scenario)) {
    errors.push(error("invalid_type", "$", "Scenario must be an object."));
    return { ok: false, errors };
  }

  checkRequiredFields(scenario, rootFields, "$", errors);
  checkKnownFields(scenario, rootFields, "$", errors);

  if (Object.hasOwn(scenario, "schema_version") && scenario.schema_version !== SCHEMA_VERSION) {
    errors.push(error("invalid_schema_version", "$.schema_version", `schema_version must be ${SCHEMA_VERSION}.`));
  }

  if (Object.hasOwn(scenario, "scenario_id")) {
    checkString(scenario.scenario_id, "$.scenario_id", errors);
  }
  if (Object.hasOwn(scenario, "step_duration_ms")) {
    checkSafeInteger(scenario.step_duration_ms, "$.step_duration_ms", errors, { positive: true });
  }
  if (Object.hasOwn(scenario, "step_count")) {
    checkSafeInteger(scenario.step_count, "$.step_count", errors, { positive: true });
  }
  if (Object.hasOwn(scenario, "initial_state")) {
    validateInitialState(scenario.initial_state, errors);
  }
  if (Object.hasOwn(scenario, "environment_steps")) {
    validateEnvironmentSteps(scenario.environment_steps, scenario.step_count, errors);
  }

  return { ok: errors.length === 0, errors };
}

export function validateScenarioDocument(text) {
  const parsed = parseScenarioJson(text);
  if (!parsed.ok) {
    return parsed;
  }
  const validation = validateResourceScenario(parsed.scenario);
  return {
    ok: validation.ok,
    scenario: parsed.scenario,
    errors: validation.errors
  };
}

export function scenarioValidationPayload(result) {
  return {
    schema_version: "resource-scenario-validation.v1",
    ok: result.ok,
    scenario_id: result.scenario?.scenario_id ?? null,
    errors: result.errors
  };
}

