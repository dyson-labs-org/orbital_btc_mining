# ADR-0002: Deterministic Offline-First

## Status

Accepted for I0 incubation.

## Context

The legacy repository includes package installation, web server, deployment,
Google Sheets, and email paths. Those paths make verification dependent on
network access, credentials, external state, or mutable provider behavior.

## Decision

All I0 verification must be deterministic and offline. The harness may run only
`git diff --check`, the built-in Node.js charter validator, and built-in Node.js
tests. Bootstrap must not install dependencies or create artifacts.

## Consequences

- No package manager is needed for I0.
- Legacy code correctness is not claimed by I0.
- Future milestones must introduce deterministic fixtures before expanding the
  verification surface.
- Any optional live or provider-backed work must be explicitly chartered in a
  later reviewed milestone.
