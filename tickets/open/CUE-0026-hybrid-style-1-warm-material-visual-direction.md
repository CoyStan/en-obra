---
id: CUE-0026
title: Hybrid Style 1 Warm Material visual direction
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-11T06:31:28Z
claim_ref: refs/palari/claims/CUE-0026
claim_heartbeat_at: 2026-06-11T06:31:28Z
claim_expires_at: 2026-06-11T08:31:28Z
allowed_paths:
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0026-*
forbidden_paths:
  - .env
  - .env.*
  - **/secrets/**
  - **/*secret*
  - **/*token*
  - infra/prod/**
  - prod/**
requires_human_confirmation: false
requires_review: true
verification:
  - npm run typecheck
  - npm test
  - npx expo config --type public
  - ./bin/palari lint CUE-0026
target_branch: main
branch: ticket/CUE-0026
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0026
accepted_by:
accepted_at:
created: 2026-06-11
updated: 2026-06-11
---

# CUE-0026 Hybrid Style 1 Warm Material visual direction

## Goal

State the result this ticket should produce.

## Scope

List what may change.

## Acceptance

- The scoped result exists.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0026

## Ticket Completion Contract

### Non-Goals

- Nearby work this ticket must not absorb.

### Definition Of Done

- Concrete done condition.

### Evidence Required

- Report, command, review, screenshot, or manual check to inspect.

### Expansion Rules

- Stop if scope, risk, or authority changes.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
