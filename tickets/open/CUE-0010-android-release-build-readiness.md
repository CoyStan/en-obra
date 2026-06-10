---
id: CUE-0010
title: Android release build readiness
status: open
risk: R2
priority: P0
stream: app
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
allowed_paths:
  - app.json
  - eas.json
  - package.json
  - package-lock.json
  - docs/production/android-release-readiness.md
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0010-*
forbidden_paths:
  - .env
  - .env.*
  - **/secrets/**
  - **/*secret*
  - infra/prod/**
  - prod/**
requires_human_confirmation: false
requires_review: true
verification:
  - npm run typecheck
  - npx expo config --type public
  - ./bin/palari lint CUE-0010
target_branch: main
branch: ticket/CUE-0010
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0010
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0010 Android release build readiness

## Goal

State the result this ticket should produce.

## Scope

List what may change.

## Acceptance

- The scoped result exists.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npx expo config --type public
- ./bin/palari lint CUE-0010

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
