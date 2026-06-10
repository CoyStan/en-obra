---
id: CUE-0019
title: Empty loading error and accessibility polish
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
  - App.tsx
  - src/components/**
  - src/screens/MainScreen.tsx
  - src/state/**
  - src/auth/**
  - src/__tests__/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0019-*
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
  - ./bin/palari lint CUE-0019
target_branch: main
branch: ticket/CUE-0019
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0019
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0019 Empty loading error and accessibility polish

## Goal

Make all empty, loading, error, disabled, and accessibility states feel
intentional, recoverable, and production-grade.

## Scope

- Empty states, loading indicators, error banners, disabled button states,
  accessibility labels/states/hints, keyboard behavior, contrast, and focused
  tests.
- Product docs and evidence for state/accessibility QA.

## Acceptance

- Empty states tell users the next useful action in concise Spanish.
- Loading and error states are visible, recoverable, and do not break layout.
- Core pressables expose appropriate accessibility roles/states and maintain at
  least 44 px touch targets.
- Small Android widths show no clipped or overlapping text in primary flows.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0019

## Ticket Completion Contract

### Non-Goals

- No full screen redesign, domain model changes, backend, payments, or Play
  Console work.

### Definition Of Done

- The app can be used through demo, empty, loading, and error states without
  feeling brittle or inaccessible.

### Evidence Required

- Specialist report.
- Unit tests where state behavior changes.
- Mobile screenshots/render checks for empty/loading/error states where
  possible.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if accessibility changes require a new navigation framework, dependency,
  or product decision outside local MVP scope.

### Final Review Gate

- Reviewer checks recoverability, copy, touch targets, contrast, and screen
  reader metadata before recommending accept, reopen, or needs-human.
