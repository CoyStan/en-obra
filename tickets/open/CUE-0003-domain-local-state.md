---
id: CUE-0003
title: Implement domain logic and local state
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
  - src/domain/**
  - src/data/**
  - src/state/**
  - src/utils/**
  - src/__tests__/**
  - package.json
  - package-lock.json
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0003-*
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
  - npm test
  - npm run typecheck
  - ./bin/palari lint CUE-0003
target_branch: main
branch: ticket/CUE-0003
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0003
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0003 Implement domain logic and local state

## Goal

Implement the local-first data model, money calculations, equal split algorithm,
settlement simplification, demo data, persistence, and tests.

## Scope

- Add TypeScript domain types and money helpers.
- Add equal-split and balance/settlement algorithms.
- Add realistic Mexico/LATAM demo data.
- Add local state actions for groups, members, expenses, settlements, and reset.
- Add unit tests for money splitting and settlements.
- Write the technical report for this ticket.

## Acceptance

- Expenses split equally by cents without losing remainder cents.
- Group balances and settlement suggestions match the demo data.
- Marking a settlement paid changes balances and records activity.
- Local state can seed, mutate, persist, and reset demo data.

## Verification

- npm test
- npm run typecheck
- ./bin/palari lint CUE-0003

## Ticket Completion Contract

### Non-Goals

- No final UI polish or screenshot evidence.
- No real network/backend/payment behavior.

### Definition Of Done

- Domain logic is covered by focused tests and is ready for UI wiring.

### Evidence Required

- Specialist technical report.
- Palari scope-check and CI evidence.

### Expansion Rules

- Keep data local and demo-safe unless a human explicitly changes the privacy or
  infrastructure model.

### Final Review Gate

- Reviewer checks calculation correctness, local persistence, and test coverage.
