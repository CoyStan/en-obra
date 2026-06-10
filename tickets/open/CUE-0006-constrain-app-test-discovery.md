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

State the result this ticket should produce.

## Scope

List what may change.

## Acceptance

- The scoped result exists.
- Path and risk rules are respected.

## Verification

- npm test
- ./bin/palari lint CUE-0006
