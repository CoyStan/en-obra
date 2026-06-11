---
id: CUE-0018
title: Settlement and balance clarity polish
status: claimed
risk: R2
priority: P0
stream: app
claimed_by: codex
claimed_at: 2026-06-11T05:52:53Z
claim_ref: refs/palari/claims/CUE-0018
claim_heartbeat_at: 2026-06-11T05:52:53Z
claim_expires_at: 2026-06-11T07:52:53Z
allowed_paths:
  - src/domain/**
  - src/components/**
  - src/screens/MainScreen.tsx
  - src/__tests__/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0018-*
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
  - ./bin/palari lint CUE-0018
target_branch: main
branch: ticket/CUE-0018
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0018
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0018 Settlement and balance clarity polish

## Goal

Make balances, who owes whom, paid settlements, and activity history instantly
clear while preserving the "Sin pagos reales" local-demo boundary.

## Scope

- Balance summary, per-member balance rows, settlement suggestions,
  settlement-confirmation UX, activity copy, balance helper logic, and focused
  tests.
- Documentation and evidence for settlement/balance review.

## Acceptance

- The balance screen answers "quien paga, quien recibe, cuanto, and why" in one
  scan.
- Settlement actions clearly mark local state only and cannot be confused with
  sending money, SPEI, cards, or payment initiation.
- Activity explains why balances changed with natural Spanish copy.
- Paid/open/even states are expressed through text plus visual state, not color
  alone.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0018

## Ticket Completion Contract

### Non-Goals

- No real payment integration, payment provider UX, bank/SPEI language, debt
  collection reminders, or account sync.
- Do not redesign group creation or expense entry; that belongs to CUE-0017.

### Definition Of Done

- A reviewer can inspect a demo group and confidently explain every open balance
  and settlement suggestion without checking code.

### Evidence Required

- Specialist report.
- Balance/domain tests for any calculation or copy-shaping changes.
- Mobile screenshots or render checks for balance and settlement states.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if a requested change implies real money movement, debt enforcement,
  legal/payment wording, or production account decisions.

### Final Review Gate

- Reviewer checks balance clarity, demo-only settlement language, activity
  traceability, and calculation safety before recommending accept, reopen, or
  needs-human.
