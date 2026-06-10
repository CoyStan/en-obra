---
id: CUE-0006
title: Constrain app test discovery
status: open
risk: R1
priority: P1
stream: app
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
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
