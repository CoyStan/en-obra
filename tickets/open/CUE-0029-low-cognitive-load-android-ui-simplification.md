---
id: CUE-0029
title: Low cognitive load Android UI simplification
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-15T23:29:31Z
claim_ref: refs/palari/claims/CUE-0029
claim_heartbeat_at: 2026-06-15T23:29:31Z
claim_expires_at: 2026-06-16T02:29:31Z
allowed_paths:
  - src/screens/**
  - src/components/**
  - src/theme/**
  - src/auth/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0029-*
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
  - ./bin/palari lint CUE-0029
target_branch: main
branch: ticket/CUE-0029
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0029
accepted_by:
accepted_at:
created: 2026-06-15
updated: 2026-06-15
---

# CUE-0029 Low cognitive load Android UI simplification

## Goal

Make the first-run Android experience feel cleaner, lighter, and easier to
understand for everyday Mexico/LATAM users with low financial confidence. The
balance tab should explain the active group, the user's local identity, the
main money state, and the next action in one calm scan without feeling like a
dense dashboard.

## Scope

- First-viewport balance screen hierarchy, spacing, visual weight, and Spanish
  copy.
- Existing local account-to-group-member identity UI and default payer behavior.
- Shared UI/theme refinements that reduce heaviness without changing app
  architecture.
- Product decisions, technical report, mobile screenshots, and Palari evidence.

## Acceptance

- The first viewport on 360px and 412px mobile widths has no clipped labels,
  overcrowded action row, or decorative content that competes with balances.
- A user can tell which group is active, whether they are using a local/demo
  identity, who owes whom, and what to tap next within a few seconds.
- The UI does not imply real payments or one-person financial control over the
  whole group.
- Copy remains Spanish-first, plain, short, and friendly.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0029

## Ticket Completion Contract

### Non-Goals

- No advanced split methods, new expense data model, backend sync, real auth
  provider, payments, notifications, Play upload, legal terms, or production
  infrastructure.
- No broad redesign of every screen if the first-viewport comprehension issue
  can be solved locally.

### Definition Of Done

- A reviewer can open the app at Android mobile widths and see a lighter,
  professional, balance-first screen with explicit local identity and clear
  next actions.

### Evidence Required

- Technical report.
- Decision-log entry for the simplification choices.
- Screenshot evidence at 360x740 and 412x915 where possible.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if the work requires legal/payment decisions, secrets, external
  services, production deployment, or destructive git cleanup.

### Final Review Gate

- Reviewer checks small-width readability, identity clarity, no-real-payment
  language, Spanish copy, scope, screenshots, and gates before recommending
  accept, reopen, or needs-human.
