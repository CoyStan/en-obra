---
id: CUE-0008
title: Auth and account model
status: accepted
risk: R2
priority: P0
stream: app
claimed_by: codex
claimed_at: 2026-06-10T18:25:37Z
claim_ref: refs/palari/claims/CUE-0008
claim_heartbeat_at: 2026-06-11T22:02:09Z
claim_expires_at: 2026-06-11T22:07:09Z
allowed_paths:
  - App.tsx
  - src/auth/**
  - src/components/**
  - src/screens/**
  - src/state/**
  - src/domain/**
  - src/data/**
  - src/__tests__/**
  - docs/production/auth-account-model.md
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0008-*
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
  - ./bin/palari lint CUE-0008
target_branch: main
branch: ticket/CUE-0008
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0008
accepted_by: founder
accepted_at: 2026-06-11T22:02:10Z
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0008 Auth and account model

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
- ./bin/palari lint CUE-0008

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
