---
id: CUE-0006
title: Constrain app test discovery
status: claimed
risk: R1
priority: P1
stream: app
claimed_by: codex
claimed_at: 2026-06-10T18:17:56Z
claim_ref: refs/palari/claims/CUE-0006
claim_heartbeat_at: 2026-06-10T18:17:56Z
claim_expires_at: 2026-06-10T20:17:56Z
allowed_paths:
  - vitest.config.ts
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0006-*
forbidden_paths:
  - .env
  - .env.*
  - **/secrets/**
  - **/*secret*
  - **/*token*
  - infra/prod/**
  - prod/**
requires_human_confirmation: false
requires_review: false
verification:
  - npm test
  - ./bin/palari lint CUE-0006
target_branch: main
branch: ticket/CUE-0006
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0006
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0006 Constrain app test discovery

## Goal

Ensure root app test runs only discover the canonical app tests, not duplicate
tests inside Palari ticket worktrees.

## Scope

- Add Vitest configuration for include/exclude patterns.
- Record the verification hygiene decision.
- Write a technical report and evidence for this ticket.

## Acceptance

- `npm test` from the canonical app root reports one app test file, not duplicate
  tests from `.palari/worktrees`.
- Palari ticket lint passes for `CUE-0006`.

## Verification

- npm test
- ./bin/palari lint CUE-0006
