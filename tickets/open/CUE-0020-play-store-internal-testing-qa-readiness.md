---
id: CUE-0020
title: Play Store internal testing QA readiness
status: open
risk: R2
priority: P1
stream: release
claimed_by:
claimed_at:
claim_ref:
claim_heartbeat_at:
claim_expires_at:
allowed_paths:
  - app.json
  - eas.json
  - package.json
  - package-lock.json
  - assets/**
  - docs/production/**
  - docs/product/**
  - reports/**
  - tickets/open/CUE-0020-*
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
  - ./bin/palari lint CUE-0020
target_branch: main
branch: ticket/CUE-0020
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0020
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0020 Play Store internal testing QA readiness

## Goal

Create a concrete QA/readiness pass for Google Play internal testing without
performing any upload, signing, deployment, or production-service setup.

## Scope

- Expo/Android config readiness review, store asset references, release scripts,
  Play readiness docs, QA checklist, screenshot inventory, Data Safety/account
  deletion notes, and evidence.

## Acceptance

- The repo clearly says what is ready for internal testing and what remains
  blocked by human accounts, signing, legal/privacy, Data Safety, or Play
  Console setup.
- Expo config validation passes or exact blockers are documented.
- Store/demo screenshots and asset expectations are listed with paths or gaps.
- No upload, signing credential generation, Play Console operation, or secret
  handling occurs.
- Path and risk rules are respected.

## Verification

- npm run typecheck
- npm test
- npx expo config --type public
- ./bin/palari lint CUE-0020

## Ticket Completion Contract

### Non-Goals

- No Play upload, EAS credential provisioning, paid service setup, production
  auth/backend/payment integration, or legal approval.

### Definition Of Done

- A founder can read the QA artifact and know the exact next human/tooling steps
  before a Play internal test upload.

### Evidence Required

- Specialist report.
- Expo public config output or summary.
- Play readiness QA checklist with blockers and owner/human-decision items.
- Palari scope/lint/CI evidence.

### Expansion Rules

- Stop if the work requires credentials, external account access, legal
  approval, paid services, or a real upload.

### Final Review Gate

- Reviewer checks QA completeness, no-secret/no-upload discipline, and clarity
  of human blockers before recommending accept, reopen, or needs-human.
