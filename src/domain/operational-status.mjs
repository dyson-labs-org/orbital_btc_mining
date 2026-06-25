export const OPERATIONAL_STATUS_SCHEMA_VERSION = "operational-status.v1";

export const OPERATIONAL_STATUS_ROOT_FIELDS = Object.freeze([
  "schema_version",
  "product_name",
  "repository",
  "maturity",
  "implementation_status",
  "runtime",
  "version",
  "capabilities"
]);

export const OPERATIONAL_STATUS_RUNTIME_FIELDS = Object.freeze([
  "name",
  "minimum_version"
]);

export const OPERATIONAL_STATUS_CAPABILITY_KEYS = Object.freeze([
  "resource_scenario_contract",
  "resource_scenario_validation",
  "deterministic_resource_transition",
  "scenario_suite_contract",
  "scenario_suite_runner",
  "resource_trace_summary",
  "simulation_kernel",
  "orbital_resource_model",
  "workload_scheduler",
  "bitcoin_workload_model",
  "ai_workload_model",
  "profitability_model",
  "scheduler",
  "telemetry",
  "anomaly_detection",
  "live_bitcoin",
  "wallet",
  "trading",
  "hosted_ai",
  "external_network",
  "hardware_control",
  "mission_authority"
]);

export const OPERATIONAL_STATUS_EXPECTED_CAPABILITIES = Object.freeze({
  resource_scenario_contract: true,
  resource_scenario_validation: true,
  deterministic_resource_transition: true,
  scenario_suite_contract: true,
  scenario_suite_runner: true,
  resource_trace_summary: false,
  simulation_kernel: false,
  orbital_resource_model: false,
  workload_scheduler: false,
  bitcoin_workload_model: false,
  ai_workload_model: false,
  profitability_model: false,
  scheduler: false,
  telemetry: false,
  anomaly_detection: false,
  live_bitcoin: false,
  wallet: false,
  trading: false,
  hosted_ai: false,
  external_network: false,
  hardware_control: false,
  mission_authority: false
});

export const OPERATIONAL_STATUS_CONSTANTS = Object.freeze({
  schema_version: OPERATIONAL_STATUS_SCHEMA_VERSION,
  product_name: "Orbital Compute Lab",
  repository: "dyson-labs-org/orbital_btc_mining",
  maturity: "operational_pilot",
  implementation_status: "controlled_test_range",
  runtime: Object.freeze({
    name: "node",
    minimum_version: "22"
  })
});

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function error(code, path, message) {
  return { code, path, message };
}

function checkExactFields(value, expectedFields, basePath, errors) {
  const keys = Object.keys(value);
  const keySet = new Set(keys);
  for (const field of expectedFields) {
    if (!keySet.has(field)) {
      errors.push(error("missing_field", `${basePath}.${field}`, `Missing required field: ${field}.`));
    }
  }
  const expectedSet = new Set(expectedFields);
  for (const field of keys.filter((key) => !expectedSet.has(key)).sort()) {
    errors.push(error("unknown_field", `${basePath}.${field}`, `Unknown field is not allowed: ${field}.`));
  }
}

function checkRequiredString(value, path, expected, errors) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(error("invalid_string", path, "Field must be a nonempty string."));
    return;
  }
  if (expected !== undefined && value !== expected) {
    errors.push(error("invalid_constant", path, `Field must equal ${JSON.stringify(expected)}.`));
  }
}

function checkVersion(value, path, errors) {
  if (typeof value !== "string" || value.length === 0 || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value)) {
    errors.push(error("invalid_version", path, "Version must be a nonempty semantic version string."));
  }
}

function checkRuntime(runtime, errors) {
  if (!isPlainObject(runtime)) {
    errors.push(error("invalid_runtime", "$.runtime", "Runtime must be an object."));
    return;
  }
  checkExactFields(runtime, OPERATIONAL_STATUS_RUNTIME_FIELDS, "$.runtime", errors);
  checkRequiredString(runtime.name, "$.runtime.name", OPERATIONAL_STATUS_CONSTANTS.runtime.name, errors);
  checkRequiredString(runtime.minimum_version, "$.runtime.minimum_version", OPERATIONAL_STATUS_CONSTANTS.runtime.minimum_version, errors);
}

function checkCapabilities(capabilities, errors) {
  if (!isPlainObject(capabilities)) {
    errors.push(error("invalid_capabilities", "$.capabilities", "Capabilities must be an object."));
    return;
  }
  checkExactFields(capabilities, OPERATIONAL_STATUS_CAPABILITY_KEYS, "$.capabilities", errors);
  for (const key of OPERATIONAL_STATUS_CAPABILITY_KEYS) {
    if (!Object.hasOwn(capabilities, key)) {
      continue;
    }
    const value = capabilities[key];
    if (typeof value !== "boolean") {
      errors.push(error("invalid_capability_value", `$.capabilities.${key}`, "Capability value must be Boolean."));
      continue;
    }
    const expected = OPERATIONAL_STATUS_EXPECTED_CAPABILITIES[key];
    if (value !== expected) {
      errors.push(error("dishonest_capability", `$.capabilities.${key}`, `Capability must be ${expected} for the committed implementation matrix.`));
    }
  }
}

export function operationalStatusCapabilityMatrix() {
  const capabilities = {};
  for (const key of OPERATIONAL_STATUS_CAPABILITY_KEYS) {
    capabilities[key] = OPERATIONAL_STATUS_EXPECTED_CAPABILITIES[key];
  }
  return Object.freeze(capabilities);
}

export function validateOperationalStatus(status) {
  const errors = [];
  if (!isPlainObject(status)) {
    errors.push(error("invalid_root", "$", "Operational status must be an object."));
    return { ok: false, errors };
  }

  checkExactFields(status, OPERATIONAL_STATUS_ROOT_FIELDS, "$", errors);
  checkRequiredString(status.schema_version, "$.schema_version", OPERATIONAL_STATUS_SCHEMA_VERSION, errors);
  checkRequiredString(status.product_name, "$.product_name", OPERATIONAL_STATUS_CONSTANTS.product_name, errors);
  checkRequiredString(status.repository, "$.repository", OPERATIONAL_STATUS_CONSTANTS.repository, errors);
  checkRequiredString(status.maturity, "$.maturity", OPERATIONAL_STATUS_CONSTANTS.maturity, errors);
  checkRequiredString(status.implementation_status, "$.implementation_status", OPERATIONAL_STATUS_CONSTANTS.implementation_status, errors);
  checkRuntime(status.runtime, errors);
  checkVersion(status.version, "$.version", errors);
  checkCapabilities(status.capabilities, errors);

  return { ok: errors.length === 0, errors };
}

export function operationalStatusValidationPayload(status) {
  const result = validateOperationalStatus(status);
  return {
    schema_version: "operational-status-validation.v1",
    status: result.ok ? "passed" : "failed",
    errors: result.errors
  };
}