---
id: CUE-0017
title: Core group and expense flow polish
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
  - src/state/**
  - src/components/**
  - src/screens/MainScreen.tsx
  - src/__tests__/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0017-*
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
  - ./bin/palari lint CUE-0017
target_branch: main
branch: ticket/CUE-0017
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0017
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0017 Core group and expense flow polish

## Goal

Make the create/select group and add expense/member flows feel fast, simple, and
safe for real non-technical users managing shared expenses in Mexico/LATAM.

## Scope

- Group list information architecture, group creation/editing UX, member entry,
  expense entry, payer selection, validation copy, and supporting tests.
- Local state behavior needed to make the flow clear and recoverable.
- Product docs and evidence for flow QA.

## Acceptance

- A user can create a group, add members, add an MXN expense, and understand the
  result without reading instructions.
- Expense forms validate required fields and amount input with natural Spanish
  error copy.
- The flow is comfortable on small Android widths and keyboard interactions do
  not hide the primary action.
- No UI suggests that data is synced or money moved when it is local-only.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0017

## Ticket Completion Contract

### Non-Goals

- No unequal splits, recurring expenses, receipt scanning, real invites,
  backend sync, or payments.
- Do not redesign the entire shell; that belongs to CUE-0016.

### Definition Of Done

- The core demo path from group creation to first expense feels complete enough
  for a founder to run live in front of users.

### Evidence Required

- Specialist report.
- Unit tests for any behavior changes.
- Mobile screenshots or documented render checks for the group/expense flow.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if the fix requires payment, invite, backend, or account-provider
  decisions.

### Final Review Gate

- Reviewer checks flow clarity, validation, Spanish copy, and small-screen
  ergonomics before recommending accept, reopen, or needs-human.
