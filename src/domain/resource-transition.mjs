import {
  validateScenarioDocument,
  validateResourceScenario
} from "./resource-scenario.mjs";

const RESULT_SCHEMA_VERSION = "resource-transition-result.v1";
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function error(code, path, message) {
  return { code, path, message };
}

function arithmeticError(path, operation) {
  return error("arithmetic_overflow", path, `Safe-integer arithmetic overflow during ${operation}.`);
}

function safeAdd(a, b, path) {
  const value = a + b;
  if (!Number.isSafeInteger(value)) {
    throw arithmeticError(path, "addition");
  }
  return value;
}

function safeSubtract(a, b, path) {
  const value = a - b;
  if (!Number.isSafeInteger(value)) {
    throw arithmeticError(path, "subtraction");
  }
  return value;
}

function cloneViolation(item) {
  return {
    code: item.code,
    step: item.step,
    amount_millijoules: item.amount_millijoules
  };
}

function applyStep(state, scenario, environmentStep) {
  const stepViolations = [];
  const step = environmentStep.step;
  const batteryBefore = state.battery_energy_millijoules;
  const thermalBefore = state.thermal_load_millijoules;

  const afterSolar = safeAdd(
    batteryBefore,
    environmentStep.solar_input_millijoules,
    `$.environment_steps[${step}].solar_input_millijoules`
  );
  const storedAfterSolar = Math.min(afterSolar, state.battery_capacity_millijoules);
  const curtailedSolar = safeSubtract(afterSolar, storedAfterSolar, `$.environment_steps[${step}].solar_input_millijoules`);

  let batteryAfter;
  let energyShortfall = 0;
  if (environmentStep.base_load_millijoules > storedAfterSolar) {
    energyShortfall = safeSubtract(
      environmentStep.base_load_millijoules,
      storedAfterSolar,
      `$.environment_steps[${step}].base_load_millijoules`
    );
    batteryAfter = 0;
    stepViolations.push({
      code: "ENERGY_DEFICIT",
      step,
      amount_millijoules: energyShortfall
    });
  } else {
    batteryAfter = safeSubtract(storedAfterSolar, environmentStep.base_load_millijoules, `$.environment_steps[${step}].base_load_millijoules`);
  }

  const thermalAfterInput = safeAdd(
    thermalBefore,
    environmentStep.thermal_input_millijoules,
    `$.environment_steps[${step}].thermal_input_millijoules`
  );
  const thermalAfterDissipation = Math.max(
    0,
    safeSubtract(
      thermalAfterInput,
      environmentStep.thermal_dissipation_millijoules,
      `$.environment_steps[${step}].thermal_dissipation_millijoules`
    )
  );
  let thermalAfter = thermalAfterDissipation;
  let thermalExcess = 0;
  if (thermalAfterDissipation > state.thermal_capacity_millijoules) {
    thermalExcess = safeSubtract(
      thermalAfterDissipation,
      state.thermal_capacity_millijoules,
      `$.environment_steps[${step}].thermal_input_millijoules`
    );
    thermalAfter = state.thermal_capacity_millijoules;
    stepViolations.push({
      code: "THERMAL_CAPACITY_EXCEEDED",
      step,
      amount_millijoules: thermalExcess
    });
  }

  state.battery_energy_millijoules = batteryAfter;
  state.thermal_load_millijoules = thermalAfter;

  return {
    step,
    battery_energy_before_millijoules: batteryBefore,
    solar_input_millijoules: environmentStep.solar_input_millijoules,
    curtailed_solar_millijoules: curtailedSolar,
    base_load_millijoules: environmentStep.base_load_millijoules,
    energy_shortfall_millijoules: energyShortfall,
    battery_energy_after_millijoules: batteryAfter,
    thermal_load_before_millijoules: thermalBefore,
    thermal_input_millijoules: environmentStep.thermal_input_millijoules,
    thermal_dissipation_millijoules: environmentStep.thermal_dissipation_millijoules,
    thermal_excess_millijoules: thermalExcess,
    thermal_load_after_millijoules: thermalAfter,
    communications_available: environmentStep.communications_available,
    downlink_capacity_bytes: environmentStep.downlink_capacity_bytes ?? 0,
    constraint_violations: stepViolations.map(cloneViolation)
  };
}

function runValidatedScenario(scenario) {
  const state = {
    battery_energy_millijoules: scenario.initial_state.battery_energy_millijoules,
    battery_capacity_millijoules: scenario.initial_state.battery_capacity_millijoules,
    thermal_load_millijoules: scenario.initial_state.thermal_load_millijoules,
    thermal_capacity_millijoules: scenario.initial_state.thermal_capacity_millijoules
  };
  const stepResults = [];
  const violations = [];

  for (const environmentStep of scenario.environment_steps) {
    const step = applyStep(state, scenario, environmentStep);
    stepResults.push(step);
    violations.push(...step.constraint_violations.map(cloneViolation));
  }

  return {
    schema_version: RESULT_SCHEMA_VERSION,
    scenario_id: scenario.scenario_id,
    outcome: violations.length === 0 ? "completed" : "constraint_violation",
    processed_steps: stepResults.length,
    final_state: {
      battery_energy_millijoules: state.battery_energy_millijoules,
      battery_capacity_millijoules: state.battery_capacity_millijoules,
      thermal_load_millijoules: state.thermal_load_millijoules,
      thermal_capacity_millijoules: state.thermal_capacity_millijoules
    },
    step_results: stepResults,
    constraint_violations: violations
  };
}

export function runResourceScenario(scenario) {
  const validation = validateResourceScenario(scenario);
  if (!validation.ok) {
    return {
      ok: false,
      process_status: "invalid_input",
      result: null,
      errors: validation.errors
    };
  }

  try {
    return {
      ok: true,
      process_status: "domain_success",
      result: runValidatedScenario(scenario),
      errors: []
    };
  } catch (caught) {
    const item = caught && typeof caught === "object" && "code" in caught
      ? caught
      : error("unexpected_internal_error", "$", "Unexpected resource transition failure.");
    return {
      ok: false,
      process_status: "internal_error",
      result: null,
      errors: [item]
    };
  }
}

export function runScenarioDocument(text) {
  const parsed = validateScenarioDocument(text);
  if (!parsed.ok) {
    return {
      ok: false,
      process_status: "invalid_input",
      result: null,
      errors: parsed.errors
    };
  }
  return runResourceScenario(parsed.scenario);
}

export function transitionResultPayload(result) {
  return {
    schema_version: "resource-transition-run.v1",
    ok: result.ok,
    process_status: result.process_status,
    outcome: result.result?.outcome ?? null,
    scenario_id: result.result?.scenario_id ?? null,
    result: result.result,
    errors: result.errors
  };
}
