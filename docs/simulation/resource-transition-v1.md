# Resource Transition Result v1

`resource-transition-result.v1` is a deterministic result format for running a
validated `resource-scenario.v1` environment timeline through a small resource
accounting engine.

The format is an incubation contract. It is not validated spacecraft
thermodynamics, not workload scheduling, and not an operational simulation
kernel.

## Inputs

The engine accepts only `resource-scenario.v1` documents. It does not introduce
new workload fields, data queues, mining fields, AI fields, provider fields, or
network-backed inputs.

## Result Schema

A successful engine run returns an object with:

- `schema_version`: always `resource-transition-result.v1`;
- `scenario_id`: copied from the scenario;
- `outcome`: `completed` or `constraint_violation`;
- `processed_steps`: count of processed environment steps;
- `final_state`: final battery and thermal values;
- `step_results`: one deterministic audit record per step;
- `constraint_violations`: flattened deterministic violation list.

## Electrical Order

For each step:

1. Record battery energy before the step.
2. Add `solar_input_millijoules` with checked safe-integer arithmetic.
3. Clamp stored battery energy to `battery_capacity_millijoules`.
4. Record excess solar as `curtailed_solar_millijoules`.
5. Apply `base_load_millijoules`.
6. If base load exceeds stored energy, set battery energy to zero, record the
   shortfall, and add an `ENERGY_DEFICIT` constraint violation.

## Thermal Order

For each step:

1. Record thermal load before the step.
2. Add `thermal_input_millijoules` with checked safe-integer arithmetic.
3. Apply `thermal_dissipation_millijoules`.
4. Do not permit thermal load below zero.
5. If thermal load exceeds `thermal_capacity_millijoules`, clamp recorded load to
   capacity, record excess load, and add `THERMAL_CAPACITY_EXCEEDED`.

Thermal accounting uses toy millijoule units for deterministic software tests.
It is not a physical spacecraft thermal model.

## Step Result Fields

Each step result includes:

- `step`;
- `battery_energy_before_millijoules`;
- `solar_input_millijoules`;
- `curtailed_solar_millijoules`;
- `base_load_millijoules`;
- `energy_shortfall_millijoules`;
- `battery_energy_after_millijoules`;
- `thermal_load_before_millijoules`;
- `thermal_input_millijoules`;
- `thermal_dissipation_millijoules`;
- `thermal_excess_millijoules`;
- `thermal_load_after_millijoules`;
- `communications_available`;
- `downlink_capacity_bytes`;
- `constraint_violations`.

Communications availability and declared downlink capacity are passed through.
No data transfer, queue, contact plan, or scheduler is modeled.

## Outcome And Exit Semantics

`completed` means every step was processed without a resource constraint.
`constraint_violation` means the valid scenario was processed and one or more
resource constraints were recorded.

Both outcomes are successful domain executions and must exit `0` in the CLI.
Malformed JSON, contract-invalid scenarios, missing files, unsupported options,
and arithmetic overflow are command failures and must exit nonzero.

## Determinism

- Step results are emitted in ascending step order.
- Energy violations precede thermal violations for the same step.
- Field insertion order is stable.
- No current time, random IDs, host information, local paths, environment values,
  provider output, or profitability calculation appears in results.

## Arithmetic

Every input and output quantity must be a safe integer. Addition and subtraction
are checked before use. Overflow is rejected rather than rounded, wrapped, or
converted to floating point.

## Non-Goals

This contract does not implement scheduling, Bitcoin workloads, AI workloads,
profitability, optimization, wallet behavior, node or pool behavior, transaction
construction, model-provider behavior, autonomous decisions, hardware control,
orbital propagation, operational mission planning, telemetry, or network behavior.
