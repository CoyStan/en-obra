---
id: CUE-0005
title: Polish and verify local MVP
status: claimed
risk: R2
priority: P1
stream: app
claimed_by: codex
claimed_at: 2026-06-10T18:10:39Z
claim_ref: refs/palari/claims/CUE-0005
claim_heartbeat_at: 2026-06-10T18:10:39Z
claim_expires_at: 2026-06-10T20:10:39Z
allowed_paths:
  - App.tsx
  - src/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0005-*
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
  - npm run lint:palari
  - ./bin/palari lint CUE-0005
target_branch: main
branch: ticket/CUE-0005
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0005
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0005 Polish and verify local MVP

## Goal

Raise the MVP to a professional demo quality bar and gather local verification
evidence.

## Scope

- Polish typography, spacing, color hierarchy, press states, empty states, error
  states, and Android touch targets.
- Verify that Spanish copy, MXN display, demo-only settlement language, and
  local-first behavior are clear.
- Capture mobile viewport screenshots or document why screenshot tooling is
  unavailable.
- Run final checks and write technical report.

## Acceptance

- The MVP feels like a real consumer finance app, not a prototype.
- Multiple mobile viewport checks are attempted and recorded.
- Checks pass or limitations are explicitly documented.
- No hard blockers are introduced.

## Verification

- npm run typecheck
- npm test
- npm run lint:palari
- ./bin/palari lint CUE-0005

## Ticket Completion Contract

### Non-Goals

- No human acceptance, production deploy, payment integration, or paid tooling.

### Definition Of Done

- App is usable locally and evidence is available for reviewer/human inspection.

### Evidence Required

- Specialist technical report.
- Screenshot paths or documented screenshot limitation.
- Palari scope-check and CI evidence.

### Expansion Rules

- Continue polishing obvious unblocked UX/test gaps. Escalate only hard blockers
  defined by the founder request.

### Final Review Gate

- Reviewer checks polish, accessibility, verification, and demo limitations.
