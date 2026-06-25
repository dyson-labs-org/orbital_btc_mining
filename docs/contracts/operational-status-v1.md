# Operational Status v1

`operational-status.v1` is the strict machine-readable status contract for Orbital Compute Lab.
It is emitted by `node src/cli.mjs status --json` and validated by `node scripts/validate-operational-status.mjs`.

## Root Object

The status object contains exactly these fields, in this order:

1. `schema_version`
2. `product_name`
3. `repository`
4. `maturity`
5. `implementation_status`
6. `runtime`
7. `version`
8. `capabilities`

Unknown root fields are invalid. Missing root fields are invalid.

## Constants

Required values:

- `schema_version`: `operational-status.v1`
- `product_name`: `Orbital Compute Lab`
- `repository`: `dyson-labs-org/orbital_btc_mining`
- `maturity`: `operational_pilot`
- `implementation_status`: `controlled_test_range`

The prior generic status schema value `1.0` is intentionally replaced. Orbital is a controlled test range and has no identified external consumer for the old generic status schema. The package version remains separate and unchanged.

## Runtime

`runtime` contains exactly:

- `name`: nonempty string, currently `node`
- `minimum_version`: nonempty string, currently `22`

Unknown runtime fields are invalid. Missing runtime fields are invalid.

## Version

`version` is a nonempty semantic version string and remains aligned with `package.json`. This contract does not create a release and does not change the package version.

## Capabilities

`capabilities` contains exactly this key set. Every value is Boolean.

- `resource_scenario_contract`
- `resource_scenario_validation`
- `deterministic_resource_transition`
- `scenario_suite_contract`
- `scenario_suite_runner`
- `resource_trace_summary`
- `simulation_kernel`
- `orbital_resource_model`
- `workload_scheduler`
- `bitcoin_workload_model`
- `ai_workload_model`
- `profitability_model`
- `scheduler`
- `telemetry`
- `anomaly_detection`
- `live_bitcoin`
- `wallet`
- `trading`
- `hosted_ai`
- `external_network`
- `hardware_control`
- `mission_authority`

At the OP-1 checkpoint, the true capability set is exactly:

- `resource_scenario_contract`
- `resource_scenario_validation`
- `deterministic_resource_transition`
- `scenario_suite_contract`
- `scenario_suite_runner`

At the OP-1 checkpoint, `resource_trace_summary` is present and false. All other capabilities are false.

A later reviewed implementation may change the truth matrix without changing this status schema, but a capability may become true only in the same reviewed commit range that implements and verifies that capability.

## Validation

Strict validation rejects:

- non-object roots;
- missing root fields;
- unknown root fields;
- wrong schema version;
- empty or wrong-type scalar fields;
- malformed runtime objects;
- missing or unknown runtime fields;
- malformed capability objects;
- missing or unknown capability keys;
- non-Boolean capability values;
- capability truth values that disagree with the committed implementation matrix.

Validation errors are deterministic and include a stable code, JSON-style path, and message.