# Resource Scenario v1

## Purpose

`resource-scenario.v1` is a deterministic input contract for future local
simulation-kernel work. It describes resource inputs over fixed timesteps. It
does not update state, schedule work, model profitability, propagate orbits,
generate telemetry, contact providers, operate hardware, or model Bitcoin or AI
workloads.

## Schema Version

Every scenario must contain:

```json
{
  "schema_version": "resource-scenario.v1"
}
```

No other schema version is accepted.

## Units

- Time: milliseconds.
- Electrical energy: millijoules.
- Thermal load and capacity: millijoules in a toy accounting model.
- Data: bytes.

The thermal fields are not validated spacecraft thermodynamics. They are integer
accounting inputs for deterministic software tests.

## Required Fields

Top-level fields are strict:

- `schema_version`
- `scenario_id`
- `step_duration_ms`
- `step_count`
- `initial_state`
- `environment_steps`

`initial_state` contains:

- `battery_energy_millijoules`
- `battery_capacity_millijoules`
- `thermal_load_millijoules`
- `thermal_capacity_millijoules`

Each `environment_steps` entry contains:

- `step`
- `solar_input_millijoules`
- `base_load_millijoules`
- `thermal_input_millijoules`
- `thermal_dissipation_millijoules`
- `communications_available`
- optional `downlink_capacity_bytes`

## Validation Rules

Validation reports all applicable errors in deterministic path order.

- Unknown fields are rejected at every object level.
- Required fields must be present. No implicit defaults are applied.
- Integer resource quantities must be nonnegative safe integers.
- Floats, unsafe integers, `NaN`, and infinity are rejected.
- `step_duration_ms` and `step_count` must be positive safe integers.
- Initial battery energy must not exceed battery capacity.
- Initial thermal load must not exceed thermal capacity.
- `environment_steps.length` must equal `step_count`.
- Step indexes must be zero-based and contiguous.
- `communications_available` must be boolean.
- `downlink_capacity_bytes` must be absent or zero when communications are
  unavailable.
- When present, `downlink_capacity_bytes` must be a nonnegative safe integer.

## Valid Example

```json
{
  "schema_version": "resource-scenario.v1",
  "scenario_id": "minimal-sunlit",
  "step_duration_ms": 1000,
  "step_count": 1,
  "initial_state": {
    "battery_energy_millijoules": 1000,
    "battery_capacity_millijoules": 2000,
    "thermal_load_millijoules": 100,
    "thermal_capacity_millijoules": 500
  },
  "environment_steps": [
    {
      "step": 0,
      "solar_input_millijoules": 300,
      "base_load_millijoules": 200,
      "thermal_input_millijoules": 20,
      "thermal_dissipation_millijoules": 10,
      "communications_available": false,
      "downlink_capacity_bytes": 0
    }
  ]
}
```

## Invalid Example

```json
{
  "schema_version": "resource-scenario.v1",
  "scenario_id": "invalid-float",
  "step_duration_ms": 1000,
  "step_count": 1,
  "initial_state": {
    "battery_energy_millijoules": 1000.5,
    "battery_capacity_millijoules": 2000,
    "thermal_load_millijoules": 100,
    "thermal_capacity_millijoules": 500
  },
  "environment_steps": []
}
```

## Future Relationship

A future simulation kernel may consume this contract after separate review. That
kernel must define state transitions, expected outputs, and uncertainty notes in
new documentation and tests. This contract only defines accepted input shape.

## Non-Goals

This format intentionally excludes workload definitions, scheduling decisions,
profitability calculations, orbital propagation, telemetry, anomaly detection,
provider model fields, wallet behavior, network behavior, mission planning, and
hardware control.

## Compatibility

The format is intentionally small. Changes require new fixtures, migration
notes, compatibility tests, and evidence showing deterministic behavior remains
stable.

