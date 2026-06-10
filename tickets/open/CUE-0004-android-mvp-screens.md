---
id: CUE-0004
title: Build Android MVP screens
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
  - App.tsx
  - src/components/**
  - src/screens/**
  - src/theme/**
  - src/state/**
  - src/domain/**
  - src/data/**
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0004-*
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
  - ./bin/palari lint CUE-0004
target_branch: main
branch: ticket/CUE-0004
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0004
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0004 Build Android MVP screens

## Goal

Build the usable Spanish-first Android MVP screens and wire the core flows to
local state.

## Scope

- Group list and selected group dashboard.
- Add group, add member, and add expense flows.
- Balance view with member balances and "quien le debe a quien" suggestions.
- Settlement marking with clear demo-only payment language.
- Activity/history timeline.
- Empty, loading, and recoverable error states.
- Write the technical report for this ticket.

## Acceptance

- A user can create a group, add members, add an expense, see settlement
  suggestions, mark one paid, and see activity update.
- UI copy is Spanish-first and MXN is visible near financial amounts.
- The app is Android-first with bottom navigation and touch-friendly controls.
- No screen presents a generic landing page.

## Verification

- npm run typecheck
- npm test
- ./bin/palari lint CUE-0004

## Ticket Completion Contract

### Non-Goals

- No production deployment.
- No real payment action.
- No new external services.

### Definition Of Done

- Core MVP is usable locally with demo and user-created data.

### Evidence Required

- Specialist technical report.
- Palari scope-check and CI evidence.

### Expansion Rules

- Make reasonable copy/layout decisions and record material decisions in the
  decision log.

### Final Review Gate

- Reviewer checks user flows, Spanish copy, path scope, and verification.
