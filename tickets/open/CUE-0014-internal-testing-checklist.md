---
id: CUE-0014
title: Internal testing checklist
status: open
risk: R2
priority: P0
stream: release
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
allowed_paths:
  - docs/production/internal-testing-checklist.md
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0014-*
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
  - test -f docs/production/internal-testing-checklist.md
  - ./bin/palari lint CUE-0014
target_branch: main
branch: ticket/CUE-0014
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0014
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0014 Internal testing checklist

## Goal

State the result this ticket should produce.

## Scope

List what may change.

## Acceptance

- The scoped result exists.
- Path and risk rules are respected.

## Verification

- test -f docs/production/internal-testing-checklist.md
- ./bin/palari lint CUE-0014

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
