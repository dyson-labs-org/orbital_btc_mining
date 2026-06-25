# Resource Trace Summary v1

`resource-trace-summary.v1` is a deterministic summary object derived from an existing `resource-transition-result.v1` trace.

It is a local operational-pilot reporting surface. It does not add a simulation kernel, scheduler, telemetry pipeline, workload model, data-transfer model, network behavior, hardware control, or mission authority.

## Source Of Truth

A summary is built from the existing resource-transition result and the validated scenario step duration. The summary layer must not reimplement the transition engine and must not alter `run-scenario` or `run-suite` semantics.

The transition result supplies:

- scenario ID;
- domain outcome;
- processed step count;
- final state;
- per-step resource accounting records;
- flattened constraint violations.

The validated scenario supplies only `step_duration_ms` so `total_duration_ms` can be calculated as `processed_steps * step_duration_ms` with safe-integer arithmetic.

## Summary Object

```json
{
  "schema_version": "resource-trace-summary.v1",
  "scenario_id": "string",
  "outcome": "completed | constraint_violation",
  "processed_steps": 0,
  "total_duration_ms": 0,
  "totals": {
    "solar_input_millijoules": 0,
    "curtailed_solar_millijoules": 0,
    "base_load_millijoules": 0,
    "energy_shortfall_millijoules": 0,
    "thermal_input_millijoules": 0,
    "thermal_dissipation_millijoules": 0,
    "thermal_excess_millijoules": 0,
    "downlink_capacity_bytes": 0,
    "communications_available_steps": 0,
    "communications_unavailable_steps": 0
  },
  "final_state": {
    "battery_energy_millijoules": 0,
    "battery_capacity_millijoules": 0,
    "thermal_load_millijoules": 0,
    "thermal_capacity_millijoules": 0
  },
  "constraint_summary": [
    {
      "code": "string",
      "count": 0,
      "total_amount_millijoules": 0
    }
  ]
}
```

## Totals

The `totals` object sums these fields from every transition step:

- `solar_input_millijoules`;
- `curtailed_solar_millijoules`;
- `base_load_millijoules`;
- `energy_shortfall_millijoules`;
- `thermal_input_millijoules`;
- `thermal_dissipation_millijoules`;
- `thermal_excess_millijoules`;
- `downlink_capacity_bytes`.

`communications_available_steps` counts steps where `communications_available` is true. `communications_unavailable_steps` counts steps where it is false.

## Constraint Summary

`constraint_summary` groups the transition result's flattened `constraint_violations` by `code` in first-observed order. For each code it records:

- `code`;
- `count`;
- `total_amount_millijoules`.

A completed scenario with no violations has an empty `constraint_summary` array.

## Process Semantics

The CLI command is:

```powershell
node src/cli.mjs summarize-scenario <path>
node src/cli.mjs summarize-scenario <path> --json
```

Text and JSON output are deterministic. JSON output wraps the summary in `resource-trace-summary-run.v1` process metadata so invalid input can be reported without pretending a summary exists.

Exit semantics:

- valid completed scenario: exit `0`;
- valid scenario with resource constraints: exit `0`;
- missing file: nonzero;
- malformed JSON: nonzero;
- contract-invalid scenario: nonzero;
- unsupported option: nonzero;
- safe-integer overflow while summarizing: distinct nonzero internal error.

## Determinism

A summary must contain no timestamps, random IDs, host information, local absolute paths, environment values, provider output, profitability calculations, workload decisions, or network-derived data.

Field order is stable. Repeated text and JSON output for the same input must be byte-identical.

## Arithmetic

All aggregation uses safe-integer arithmetic. Overflow is rejected rather than rounded, wrapped, or converted to floating point.

## Non-Goals

This contract does not implement scheduling, telemetry ingestion, data transfer, downlink execution, optimization, Bitcoin workloads, AI workloads, profitability, wallet behavior, transaction construction, hosted model behavior, autonomous decisions, hardware control, orbital propagation, operational mission planning, or network behavior.
