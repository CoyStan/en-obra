---
id: CUE-0015
title: Professional Android UI redesign and product-quality pass
status: in-review
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-10T19:47:24Z
claim_ref: refs/palari/claims/CUE-0015
claim_heartbeat_at: 2026-06-10T20:06:22Z
claim_expires_at: 2026-06-10T20:36:22Z
allowed_paths:
  - src/**
  - App.tsx
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0015-*
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
  - ./bin/palari lint CUE-0015
target_branch: main
branch: ticket/CUE-0015
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0015
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0015 Professional Android UI redesign and product-quality pass

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
- ./bin/palari lint CUE-0015

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
