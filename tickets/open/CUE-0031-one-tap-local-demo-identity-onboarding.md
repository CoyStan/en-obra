---
id: CUE-0031
title: One tap local demo identity onboarding
status: claimed
risk: R2
priority: P0
stream: design
claimed_by: codex
claimed_at: 2026-06-15T23:49:02Z
claim_ref: refs/palari/claims/CUE-0031
claim_heartbeat_at: 2026-06-15T23:49:02Z
claim_expires_at: 2026-06-16T02:49:03Z
allowed_paths:
  - src/screens/**
  - src/auth/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0030-*
  - tickets/open/CUE-0031-*
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
  - npm test
  - npx expo config --type public
  - ./bin/palari lint CUE-0031
target_branch: main
branch: ticket/CUE-0031
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0031
accepted_by:
accepted_at:
created: 2026-06-15
updated: 2026-06-15
---

# CUE-0031 One tap local demo identity onboarding

## Goal

Make the first-run local identity path obvious. A demo user should be able to
create a local profile and, when the active group contains Ana, map that profile
to Ana with one clear action so the personal balance screen appears without
confusing setup steps.

## Scope

- Profile/identity onboarding copy and actions.
- Local demo profile creation flow in `MainScreen`.
- Small cleanup of typed UI rough edges in touched screen code.
- Decision log, technical report, screenshots, and Palari evidence.

## Acceptance

- Guest users see a clear primary local-demo action in the profile screen.
- The action creates a local mock profile and maps it to Ana in the active group
  when Ana is a group member.
- The app returns to the balance screen after the demo profile is ready.
- Copy makes clear the profile is local/demo and does not imply real account
  provider, sync, or payments.
- Existing manual profile fields remain available.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0031

## Ticket Completion Contract

### Non-Goals

- No real auth provider, invites, backend sync, payment rails, legal copy,
  production account setup, or app-store work.
- No changes to expense math or settlement calculation.

### Definition Of Done

- A reviewer can start from guest mode, use one obvious local-demo action, and
  land back on the balance screen with personal balance context available.

### Evidence Required

- Technical report.
- Decision-log entry.
- Screenshot evidence of the local demo profile action and resulting balance
  screen where possible.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if the work requires real credentials, provider selection, privacy/legal
  decisions, external services, or production deployment.

### Final Review Gate

- Reviewer checks first-run clarity, local/demo wording, no-real-payment
  boundaries, screenshots, and gates before recommending accept, reopen, or
  needs-human.
