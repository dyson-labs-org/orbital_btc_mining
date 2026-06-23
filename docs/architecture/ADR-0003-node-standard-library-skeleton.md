# ADR-0003: Node Standard-Library Skeleton

## Status

Accepted for I0.5 incubation.

## Context

I0.5 removes legacy implementation code from active main and needs a small,
deterministic product skeleton that verifies on Windows and Ubuntu without
dependency installation or external services.

## Decision

Use Node.js 22-or-newer ECMAScript modules and Node built-in modules only for
the I0.5 product skeleton.

## Rationale

- No dependency installation is required.
- Local and CI verification are deterministic.
- The same canonical verification can run on Windows and Ubuntu.
- The active audit surface stays small.
- No TypeScript compiler or bundler is introduced yet.
- This does not commit later scientific work to JavaScript.
- Future language or toolchain changes require a reviewed ADR.
- Domain logic must remain decoupled from external AI and Bitcoin providers.
- Future simulation should prefer integer or fixed-point units where exact
  accounting matters.
- Future time progression must be explicit and must not depend on wall-clock
  time.
- Future randomness must be seeded and reproducible.

## Non-Goals

- Selecting an AI framework.
- Selecting a Bitcoin library.
- Selecting an optimization solver.
- Selecting a visualization framework.
- Selecting a hosted model provider.

## Consequences

The skeleton can expose product metadata and an honest status CLI. It must not
implement a simulation kernel, scheduler, Bitcoin workload, AI workload, wallet,
trading, hardware control, mission planning, or external-network behavior.
