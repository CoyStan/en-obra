---
id: CUE-0022
title: Advanced split methods
status: open
risk: R2
priority: P1
stream: app
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
allowed_paths:
  - src/domain/**
  - src/state/**
  - src/screens/**
  - src/components/**
  - src/__tests__/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0022-*
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
  - ./bin/palari lint CUE-0022
target_branch: main
branch: ticket/CUE-0022
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0022
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0022 Advanced split methods

## Goal

Add advanced split methods inspired by competitors once the simpler participant
selection flow is stable.

## Scope

- Unequal shares, exact amounts, percentages, and focused calculation tests.
- UI that makes advanced split choices understandable in Spanish.

## Acceptance

- Users can choose an advanced split method without breaking the simple equal
  split default.
- Calculations are cent-safe and covered by tests.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0022

## Ticket Completion Contract

### Non-Goals

- No payments, backend sync, receipt OCR, or currency conversion.

### Definition Of Done

- Advanced split behavior is correct, tested, and understandable in the app.

### Evidence Required

- Technical report, tests, screenshots, and Palari evidence.

### Expansion Rules

- Stop if the UI needs product decisions that would confuse the default flow.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
