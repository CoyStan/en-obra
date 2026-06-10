---
id: CUE-0002
title: Scaffold Expo Android app
status: in-review
risk: R2
priority: P0
stream: app
claimed_by: codex
claimed_at: 2026-06-10T17:57:41Z
claim_ref: refs/palari/claims/CUE-0002
claim_heartbeat_at: 2026-06-10T17:57:41Z
claim_expires_at: 2026-06-10T19:57:41Z
allowed_paths:
  - package.json
  - package-lock.json
  - app.json
  - App.tsx
  - tsconfig.json
  - babel.config.js
  - src/**
  - assets/**
  - docs/product/decisions.md
  - reports/**
  - tickets/open/CUE-0002-*
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
  - ./bin/palari lint CUE-0002
target_branch: main
branch: ticket/CUE-0002
worktree: /home/quetza/projects/cuentas-claras/.palari/worktrees/CUE-0002
accepted_by:
accepted_at:
created: 2026-06-10
updated: 2026-06-10
---

# CUE-0002 Scaffold Expo Android app

## Goal

Create the Expo React Native TypeScript app scaffold and enough shell structure
for later app tickets to build on.

## Scope

- Add npm scripts and dependencies for Expo, React Native, TypeScript, and local
  storage.
- Add `app.json`, `tsconfig.json`, `App.tsx`, and initial `src/**` structure.
- Add theme primitives and a minimal app shell that renders on Expo.
- Record any scaffold decisions in `docs/product/decisions.md`.
- Write the technical report for this ticket.

## Acceptance

- `npm install` has produced a lockfile.
- `npm run typecheck` passes.
- Expo can start locally without secrets or paid services.
- The first screen is an app shell, not a landing page.

## Verification

- npm run typecheck
- ./bin/palari lint CUE-0002

## Ticket Completion Contract

### Non-Goals

- No full expense domain implementation.
- No real payment, cloud, auth, or production setup.

### Definition Of Done

- App scaffold files exist and typecheck.
- Later tickets can add domain logic and screens without replacing the stack.

### Evidence Required

- Specialist technical report.
- Palari scope-check and CI evidence.

### Expansion Rules

- Stop for human input only if paid services, secrets, production deployment, or
  payment/legal decisions become necessary.

### Final Review Gate

- Reviewer checks scaffold scope, dependency appropriateness, and verification.
