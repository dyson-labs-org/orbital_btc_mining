# Research Assumptions

This document separates research assumptions from verified behavior.

## Current Assumptions

- Orbital compute can be studied initially as an offline simulation problem.
- Energy availability, thermal behavior, communications windows, workload
  scheduling, and economics should be modeled separately before being combined.
- Any Bitcoin-related economics in the legacy code are illustrative only.
- Static ground-station names in the legacy RF model are reference data, not a
  live provider integration.
- A future local AI advisor, if evaluated, must be optional and must not be a
  source of truth for simulation results.

## Not Yet Verified

- Numerical correctness of legacy orbit, RF, thermal, power, and cost models.
- Fitness of dependency versions in `requirements.txt`.
- Suitability of any deployment configuration.
- Accuracy of Bitcoin price, block reward, network hashrate, or revenue
  assumptions.
- Legal, privacy, licensing, or export-control readiness.
- Operational feasibility of orbital compute or mining.

## Evidence Standard

Future milestones must attach deterministic fixtures, expected outputs,
uncertainty bounds, and reviewed assumptions before claiming model correctness.
External services and live credentials are not acceptable evidence for I0.
