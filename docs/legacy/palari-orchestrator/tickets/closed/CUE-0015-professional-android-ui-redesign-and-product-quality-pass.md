---
id: CUE-0015
title: Professional Android UI redesign and product-quality pass
status: accepted
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-10T19:47:24Z
claim_ref: refs/palari/claims/CUE-0015
claim_heartbeat_at: 2026-06-11T22:02:10Z
claim_expires_at: 2026-06-11T22:07:10Z
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
accepted_by: founder
accepted_at: 2026-06-11T22:02:11Z
created: 2026-06-10
updated: 2026-06-11
---

# CUE-0015 Professional Android UI redesign and product-quality pass

## Goal

Raise the MVP UI to a professional Android-first consumer-finance standard with
clear balances, trustworthy settlement messaging, compact Spanish-first flows,
and mobile screenshot evidence.

## Scope

- App UI, theme, demo data copy, balance preview helpers, and product design
  docs.
- CUE-0015 reports, evidence, reviewer note, and ticket metadata.

## Acceptance

- Group, balance, settlement, activity, and profile surfaces feel polished and
  finance-appropriate on Android-sized screens.
- "Sin pagos reales" is prominent near settlement actions and confirmation.
- Forms use focused modal/bottom-sheet patterns without cluttering the main
  balance view.
- Multi-viewport mobile screenshots exist and are nonblank/readable.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0015

## Ticket Completion Contract

### Non-Goals

- No real payments, backend, production auth provider, analytics, paid APIs,
  secrets, Play upload, or new package dependencies.

### Definition Of Done

- UI polish, design docs, reports, reviewer note, Palari evidence, and mobile
  screenshots are complete; app checks and Palari gates pass.

### Evidence Required

- `reports/CUE-0015-technical-report.md`
- `reports/CUE-0015-reviewer-note.md`
- `reports/evidence/CUE-0015/visual-verification.md`
- `reports/evidence/CUE-0015/screenshots/mobile-360x740.png`
- `reports/evidence/CUE-0015/screenshots/mobile-412x915.png`
- Typecheck, tests, Expo config, Palari lint/scope/ci output.

### Expansion Rules

- Stop if changes require payment semantics, backend sync, real auth,
  production deletion promises, legal approval, or Play upload authority.

### Final Review Gate

- Reviewer checks each done item and recommends accept, reopen, or needs-human.
