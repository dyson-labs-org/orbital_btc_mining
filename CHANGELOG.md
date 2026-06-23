# Changelog

## Unreleased

- Isolate legacy source from active main while preserving it on
  `legacy/pre-orbital-compute-lab`.
- Add a dependency-free Orbital Compute Lab Node.js skeleton and deterministic
  status CLI.
- Add I0.5 validation for no dependencies, no network behavior, no subprocess
  behavior, no simulation kernel, no Bitcoin behavior, and no AI behavior.
- Add the I1A `resource-scenario.v1` contract, deterministic validator, CLI
  validation command, fixtures, and expected-negative verification.
- Record harness evaluation cycle 1 as `pass_with_findings` with product and
  harness results separated.
- Add the I1B deterministic resource-transition engine, typed domain outcomes,
  run fixtures, CLI run command, canonical verification checks, and Cycle 2
  preregistration.
- Record harness evaluation cycle 2 as `pass_with_findings`, with product
  behavior separated from harness integrity and evidence-packaging findings.
- Add the I1C `scenario-suite.v1` contract, deterministic suite runner, suite
  fixtures, CLI run-suite command, canonical verification checks, and Cycle 3
  preregistration.
