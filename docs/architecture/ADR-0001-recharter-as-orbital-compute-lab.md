# ADR-0001: Re-charter As Orbital Compute Lab

## Status

Accepted for I0 incubation.

## Context

The repository baseline is an orbital Bitcoin-mining Flask application with
deployment, Google Sheets, email, and local-path legacy surfaces. The requested
milestone requires a safer provider-neutral incubation posture that preserves
history while preventing accidental operational claims.

## Decision

Re-charter the repository as Orbital Compute Lab, an offline deterministic
research incubation repository. The legacy app remains as audit evidence and is
not an authorized execution path for I0.

## Consequences

- README and docs describe incubation rather than deployment.
- Legacy commands are inventoried as `not_run`.
- Harness verification validates the charter and documentation contract.
- Future implementation must be deterministic, offline, and evidence-backed.
- The existing repository name and local directory remain unchanged.
